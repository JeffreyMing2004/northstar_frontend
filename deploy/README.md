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
| 反代识别真实 IP | 新增 `server.forward-headers-strategy=framework`，让 Spring 采信 `X-Forwarded-*` |
| CORS | `CORS_ORIGINS`，默认已含 `https://northstar.mingpixel.net` |
| 校验限流 | `VERIFY_RATE_LIMIT_PER_MINUTE`，默认 60/分钟/IP |

### ⚠️ X-Forwarded-For 必须「覆盖」而非「追加」

后端 `BetaController.resolveClientIp()` 取 `X-Forwarded-For` 的**第一段**当来源 IP，用于校验接口限流。
所以 OpenResty 里写的是：

```nginx
proxy_set_header X-Forwarded-For $remote_addr;        # ✅ 覆盖
# proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;   # ❌ 追加，可被伪造
```

用 `$proxy_add_x_forwarded_for` 时，客户端只要自带一个 `X-Forwarded-For: 1.2.3.4`，
该值就会排到最前被后端采信 —— 换着假 IP 就能绕过限流。

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

# ⑤ index.html 不可缓存
curl -sI https://northstar.mingpixel.net/ | grep -i cache-control
#   期望包含 no-cache

# ⑥ 验证限流是否真的按真实 IP 生效（防伪造）
curl -s -H "X-Forwarded-For: 1.2.3.4" \
     "https://northstar.mingpixel.net/api/beta/verify?qq=123456789&name=Steve" > /dev/null
#   然后到后台「校验日志」查这条记录，IP 应是你的真实出口 IP，而不是 1.2.3.4
```

## 5. 客户端 Mod 侧配置

反代配好后，玩家端 `config/northstarclientverification-common.toml` 里的地址要跟着改：

```toml
verifyUrl = "https://northstar.mingpixel.net/api/beta/verify"
```

`verifyUrl` 留空时 Mod 会**跳过校验直接放行**（`SKIPPED`），所以发版时务必填上。

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
| CORS 报错 | 说明 `VITE_API_BASE_URL` 被改成了绝对地址但后端白名单没加该 Origin |
