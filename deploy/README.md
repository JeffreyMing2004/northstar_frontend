# 生产环境部署与 API 接入

线上站点：**https://northstar.mingpixel.net**

## 架构

```
浏览器 ──https──► OpenResty (northstar.mingpixel.net)
                   ├── /            → 前端静态文件（vite 构建产物 dist/）
                   └── /api/...     → 反代到 Spring Boot 127.0.0.1:8080
Minecraft 客户端 Mod ──https──► /api/beta/verify   （与网页共用同一个域名）
```

**同源方案**：前端和接口都在 `northstar.mingpixel.net` 下，浏览器不产生跨域请求。
后端 `app.cors.allowed-origins` 默认已包含该域名，无需改动即兼容。

## 1. 前端构建与发布

```bash
cd northstar_frontend
npm install                 # 首次
npm run build               # 读取 .env.production，输出到 dist/

# 发布到 OpenResty 站点根目录（示例路径，按实际站点目录调整）
rsync -av --delete dist/ /www/sites/northstar.mingpixel.net/index/
```

注意 `--delete` 会清掉目标目录里不在 `dist/` 中的文件，首次发布前确认该目录只放前端产物。

## 2. 环境变量

| 变量 | 作用 | 生产取值 |
|---|---|---|
| `VITE_API_BASE_URL` | axios 的 `baseURL`，决定请求打到哪 | `/api`（同源，推荐） |
| `VITE_DEV_PROXY_TARGET` | 仅本地 `vite dev` 的转发目标 | 不用于生产构建 |

- `.env.development` / `.env.production` 已入库（不含密钥）。
- 本地个人覆盖请写 `.env.local` 或 `.env.production.local`，这两个已被 `.gitignore` 忽略。
- 变量必须以 `VITE_` 开头才会注入前端；Vite 在**构建时**做字面量替换，**改完必须重新 `npm run build`**，只改文件不重新构建不生效。

改绝对地址的场景（后端挪到独立域名时）：

```
VITE_API_BASE_URL=https://api.mingpixel.net/api
```
此时必须同步把 `https://northstar.mingpixel.net` 加进后端 `CORS_ORIGINS`。

## 3. 后端要点

| 项 | 值 / 说明 |
|---|---|
| 监听端口 | `SERVER_PORT`，默认 `8080`，与 `upstream northstar_backend` 一致 |
| 运行 profile | **必须** `SPRING_PROFILES_ACTIVE=prod`。加固后后端会拒绝以 local profile 连远程库启动 |
| 反代识别真实 IP | `server.forward-headers-strategy=framework`（后端默认值），让 Spring 采信 `X-Forwarded-*` |
| CORS | `CORS_ORIGINS`，默认已含 `https://northstar.mingpixel.net` |
| 校验限流 | `VERIFY_RATE_LIMIT_PER_MINUTE`，默认 60/分钟/IP |

### ⚠️ 来源 IP 链路：Cloudflare realip 是硬前提

按 IP 限流要准，前提是后端能拿到**真实玩家 IP**。这条链路有三段，缺一段就会
把所有用户算成同一个人：

```
玩家 → Cloudflare → OpenResty → Spring Boot
        ↑ CF-Connecting-IP      ↑ $remote_addr      ↑ remoteAddr
          （CF 写入的客户真实 IP）  （realip 还原）      （framework 策略还原）
```

后端 `ClientIp.of()` 的取值顺序（`northstar_backend/.../support/ClientIp.java`）：

1. `request.getRemoteAddr()` —— 只要不是回环地址就采用它；
   `forward-headers-strategy=framework` 会把反代传来的 `X-Forwarded-For` 还原到这里。
2. 只有当 1 还是 `127.0.0.1`（本地直连、或反代没传头）时，才退回读 `X-Forwarded-For` / `X-Real-IP`。

**所以必须在 OpenResty 里配 Cloudflare realip**，否则链路第一段的 `$remote_addr`
是 CF 边缘节点 IP，全站玩家会共用同一份额度（登录 30 次/5 分钟、发码 5 次/10 分钟），
正常用户也会撞上 429：

```nginx
# 只信任 Cloudflare 的出口段；千万别写 0.0.0.0/0，否则任何人都能伪造 CF-Connecting-IP
# 段列表见 https://www.cloudflare.com/ips/ （IPv4 / IPv6 两张，官方会更新，需定期同步）
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
# ... 按官方最新列表补齐 ...
real_ip_header CF-Connecting-IP;
real_ip_recursive on;
```

配好后 `$remote_addr` 就是玩家真实 IP，`X-Real-IP` 与 `X-Forwarded-For` 也随之正确。

### ⚠️ X-Forwarded-For 必须「覆盖」而非「追加」

反代侧仍要显式覆盖，别用 `$proxy_add_x_forwarded_for` 追加：

```nginx
proxy_set_header X-Forwarded-For $remote_addr;        # ✅ 覆盖
# proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # ❌ 追加，可被伪造
```

用 `$proxy_add_x_forwarded_for` 时，客户端只要自带一个 `X-Forwarded-For: 1.2.3.4`，
该值会被排到最前并被 Spring 的 framework 策略还原进 `remoteAddr`，
于是**第 1 条取值路径就被污染**，换着假 IP 就能绕过限流。

> 历史说明：加固前后端是取 `X-Forwarded-For` 的**首段**，现在改为以
> `remoteAddr` 为准、并且要求它由反代覆盖写入。这条「覆盖」要求在修复后依然成立。

### 限流阈值（后端默认值，可用环境变量覆盖）

| 接口 | 阈值 | 环境变量 |
|---|---|---|
| 登录 | 同 IP 30 次 / 5 分钟；同账号连续失败 10 次 / 15 分钟 | `AUTH_LOGIN_IP_LIMIT`、`AUTH_LOGIN_ACCOUNT_FAIL_LIMIT` |
| 发送验证码 | 同 IP 5 次 / 10 分钟；同邮箱 60 秒冷却 | `AUTH_SEND_CODE_IP_LIMIT` |
| 找回身份 / 重置密码 | 同 IP 10 次 / 10 分钟 | `AUTH_FORGOT_LOOKUP_IP_LIMIT`、`AUTH_RESET_IP_LIMIT` |
| 内测资格查询 | 同 IP 60 次 / 分钟 | `VERIFY_RATE_LIMIT_PER_MINUTE` |

触发限流统一返回 `429` + `Retry-After`（秒）。前端已按这个响应头提示
「操作过于频繁，请 N 分钟后重试」，**反代不要吞掉 `Retry-After` 响应头**。

### 静态站的响应头

后端下发的安全头（HSTS / CSP / nosniff / X-Frame-Options 等）只覆盖 `/api/**`，
**静态页面由 OpenResty 直接返回，不受其保护**。若要给页面也加上，可在站点配置里补：

```nginx
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header Referrer-Policy strict-origin-when-cross-origin always;
# CSP 要按实际资源改：本站用了内联 style 属性与 data: 图片，直接照搬后端的
# default-src 'none' 会把页面打白，务必先 curl 一把确认再加。
# add_header Content-Security-Policy "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'" always;
```

## 4. 上线验收清单

```bash
# ① 前端页面
curl -sI https://northstar.mingpixel.net/ | head -1
#   期望 200，Content-Type: text/html

# ② 后端连通性（先确认本机直连没问题）
curl -s http://127.0.0.1:8080/api/beta/plans | head -c 200

# ③ 经反代的接口
curl -s https://northstar.mingpixel.net/api/beta/plans | head -c 200
#   期望返回 JSON（ApiResponse 结构）

# ④ 校验接口（客户端 Mod 唯一依赖的接口，最不能出错）
curl -s "https://northstar.mingpixel.net/api/beta/verify?qq=123456789&name=Steve"
#   期望返回 JSON：{"success":false,"code":1001,...}
#   （success:false 也算通过 —— 说明匿名放行已生效、判定在跑；
#     白名单里有该 QQ 且游戏ID 匹配时才会是 true）
#
#   ⚠️ 若返回 403 且响应体为空 → 生产后端是**旧构建**，SecurityConfig 里还没有
#      /api/beta/verify 的 permitAll 放行。此时**不要**让客户端 Mod 切到生产：
#      403 会被 Mod 判为「服务不可用」，玩家会永久卡在验证界面（不消耗重试次数，
#      且 ESC 被禁用，只能退出游戏）。先重新部署后端再切。
#
#   ✅ 2026-09-24 复验记录（v3.7 切生产前）：
#      GET /api/beta/verify?qq=10001&name=ProdProbe
#        → 200, 1.83s, {"code":1001,"data":null,"msg":"该 QQ 未获得内测资格","success":false}
#        响应头含 X-XSS-Protection:0 / Cache-Control: no-cache,no-store,must-revalidate
#        → Spring Security 已放行，非旧构建、非反代拦截（cf-cache-status: DYNAMIC 已回源）
#      GET /api/beta/plans            → 200（公开）
#      GET /api/beta/my-application   → 403（匿名，鉴权边界正确）
#      POST /api/beta/apply           → 403（匿名，鉴权边界正确）
#     结论：可以切换客户端 Mod 到生产模式。

# ⑤ index.html 不可缓存
curl -sI https://northstar.mingpixel.net/ | grep -i cache-control
#   期望包含 no-cache

# ⑥ 验证限流是否真的按真实 IP 生效（防伪造）
curl -s -H "X-Forwarded-For: 1.2.3.4" \
     "https://northstar.mingpixel.net/api/beta/verify?qq=123456789&name=Steve" > /dev/null
#   然后到后台「校验日志」查这条记录，IP 应是你的真实出口 IP，而不是 1.2.3.4

# ⑦ 验证 Cloudflare realip 真的生效（限流按人算，而不是按 CF 边缘节点算）
#   从两个不同网络（例如手机热点 + 家宽）各打一次，到后台「校验日志」看 IP：
#   期望两条记录是**两个不同的公网 IP**。若都相同且形似 172.7x/104.2x（CF 段），
#   说明 OpenResty 的 real_ip_header 没配或没重载。
curl -s "https://northstar.mingpixel.net/api/beta/verify?qq=123456789&name=IpProbe" > /dev/null

# ⑧ 验证 429 与 Retry-After
for i in $(seq 1 8); do
  curl -s -o /dev/null -w "%{http_code} " -X POST \
       -H 'Content-Type: application/json' \
       -d '{"email":"probe@example.com","purpose":"register"}' \
       https://northstar.mingpixel.net/api/auth/send-code
done; echo
#   期望：前几次 200/400，超过 IP 阈值后变 429
curl -sI -X POST -H 'Content-Type: application/json' -d '{}' \
     https://northstar.mingpixel.net/api/auth/send-code | grep -i retry-after
#   期望：有 Retry-After 头（⚠️ 若被 CF/反代剥掉，前端只能提示「请稍后重试」）

# ⑨ 确认后端安全头已生效（这些头只由后端下发，覆盖 /api/**）
curl -sI https://northstar.mingpixel.net/api/beta/plans | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy|content-security'
#   期望：至少看到 strict-transport-security（HSTS）与 x-frame-options。
#   若一个都没有 → 后端是旧构建，或 FORCE_HTTPS/X-Forwarded-Proto 没传导致 HSTS 被跳过。
```

## 5. 客户端 Mod 侧配置

自 **v3.7**（2026-09-24）起，Mod 的代码默认值已是生产地址
（`Config.DEFAULT_VERIFY_URL = VERIFY_URL_PROD`），新玩家无需改配置即可直连生产。
玩家端 `config/northstarclientverification-common.toml` 里的地址如需手工覆盖：

```toml
verifyUrl = "https://northstar.mingpixel.net/api/beta/verify"
```

`verifyUrl` 留空时 Mod 会**跳过校验直接放行**（`SKIPPED`），所以发版时务必填上。
本地联调时才把该值改回 `http://127.0.0.1:8080/api/beta/verify`（需先起本机后端）。

## 6. 常见问题

| 现象 | 排查方向 |
|---|---|
| 页面 200 但接口全 404 | `location ^~ /api/` 没配，或 `proxy_pass` 后面多写了路径 |
| 接口返回 502 | 后端没起，或 `upstream` 地址/端口不对；先 `curl 127.0.0.1:8080/api/beta/plans` |
| 接口返回 403 且响应体为空 | 先确认这个接口**是否本来就该匿名放行**。Spring Security 在「未命中 `permitAll`」时返回 403 空体，响应头带 `X-XSS-Protection: 0`、`Vary: Origin,...`。是 `/api/admin/**` → 需要管理员 JWT；是 `/api/beta/verify` 这类 `permitAll` 接口 → **生产后端是旧构建**（`SecurityConfig` 里还没这行放行），重新部署即可 |
| 同一接口本机 200、生产 403 | 部署版本落后于代码，**不是**反代配置错。查该放行行是哪个提交加的：`git log -S'/api/beta/verify' -- src/main/java/com/ming/northstar_backend/config/SecurityConfig.java`，再与生产发布时间比对 |
| 客户端 Mod 全员卡在验证界面 | 用它自己的地址打一次：`curl -s "<verifyUrl>"`。403/超时都会被 Mod 判为「服务不可用」——不消耗重试次数，但玩家出不去（`blockEscape = true` 时 ESC 也禁用） |
| 发版后仍是旧页面 | `index.html` 被缓存；检查 `location = /index.html` 的 `Cache-Control` |
| 白名单 CSV 导入报 413 | `client_max_body_size` 太小 |
| 限流日志里的 IP 全是 127.0.0.1 | 反代没传 `X-Forwarded-For`，或后端 `forward-headers-strategy` 未生效 |
| 限流日志里的 IP 全是同一个公网地址、用户频繁被 429 | Cloudflare realip 没配：`$remote_addr` 拿到的是 CF 边缘节点 IP。按 §3 补 `set_real_ip_from` + `real_ip_header CF-Connecting-IP` 后重载 |
| 登录/发码/找回接口大面积 429 | 同上一行；加固后这几类接口都加了按 IP 限流，来源 IP 一旦被折叠成同一个就会全站误伤 |
| 接口提示「登录状态已失效」但用户刚登录 | 该账号的密码被重置或被管理员改过，存量令牌按设计已吊销，重新登录即可 |
| 注册/重置页提示密码不合规 | 密码规则已加严为 8-72 位且必须同时包含字母和数字，前端与后端同规则，按提示改即可 |
| CORS 报错 | 说明 `VITE_API_BASE_URL` 被改成了绝对地址但后端白名单没加该 Origin |
