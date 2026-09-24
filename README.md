# NorthStar 前端（注册 / 内测平台）

NorthStar 北极战区的玩家门户：注册登录、内测资格申请与查询、排行榜与战绩查询、房间大厅、管理后台、账号设置。

- 站点：<https://northstar.mingpixel.net>
- 后端：[`northstar_backend`](https://github.com/JeffreyMing2004/northstar_Backend)（Spring Boot，独立仓库）
- 客户端：`NorthStarClientverification`（Forge 1.20.1 Mod，独立仓库）

## 技术栈

Vue 3 + Vue Router 4（hash 路由）+ Vite 5 + Axios。
没有引入状态管理库，登录态放在 `src/stores/auth.js`，持久化在 `localStorage`。

## 快速开始

```bash
npm install
npm run dev       # http://localhost:5173 ，/api 由 vite dev proxy 转发
npm run build     # 产物在 dist/
npm run preview   # 本地预览构建产物（不含 /api 反代，接口需另配）
```

开发时后端需跑在 `VITE_DEV_PROXY_TARGET`（默认 `http://localhost:8080`）。

## 环境变量

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | 后端 API 基地址。保持相对路径即同源，浏览器不产生跨域 |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:8080` | 仅本地开发：vite dev server 把 `/api` 转发到哪 |

只有 `VITE_` 前缀的变量会被注入前端代码。`.env.example`、`.env.development`、`.env.production` 都会进版本库（不含密钥）；本地临时覆盖请用 `.env.local`（已忽略）。

## 目录结构

```
src/
├── api/          每个后端模块一个文件，统一走 api/index.js 里那个 axios 实例
├── assets/
│   ├── icons/mdi.js      图标数据唯一来源（自托管，按需打包）
│   └── styles/main.css   全局样式与设计变量（--accent-primary 等）
├── components/   AppHeader / AppFooter / NsIcon / PlayerAvatar
├── router/       路由表与登录守卫（meta.requiresAuth / meta.requiresAdmin）
├── stores/auth.js
└── views/        各页面
deploy/           生产部署：OpenResty 站点配置与部署说明
```

## 与后端的约定

- 前端一律走相对路径 `/api`，**不产生跨域请求**：开发由 vite dev proxy 转发，线上由 OpenResty 把 `/api` 反代到后端。因此线上即使后端 CORS 白名单配错也不影响前端。
- 响应统一为 `{ code, message, data }`。`src/api/index.js` 的响应拦截器已经把外层剥掉，业务代码直接读 `res.data`。
- 401 会自动清除登录态并跳转登录页；403 会补一句「当前账号没有访问该功能的权限」。
- 业务错误优先展示后端 `message` 原文（例如「QQ 号已绑定，绑定后不可更改」），所以后端不要吞异常换成 500。

## 图标：自托管

图标全部来自 `@mdi/js` 的 SVG path，在 `src/assets/icons/mdi.js` 里按需 `import`，Vite 会 tree-shake，产物中只包含实际用到的几十个图标（每个约 300 字节）。

以前是 `<link>` 引 jsdelivr 上的 `@mdi/font`，国内访问不稳，字体一拉不到图标就整片空白。现在**没有任何外链字体**，也不存在字体加载时的图标闪烁。

新增图标：先在 `node_modules/@mdi/js` 里确认导出名再写进映射表。命名规则是 CSS 名转驼峰（`mdi-account` → `mdiAccount`），但 MDI 7.x 改过一部分名字，例如 `megaphone` 现在叫 `bullhorn`。

## 部署

见 [`deploy/README.md`](deploy/README.md)：OpenResty 配置、环境变量、验收清单与排错对照表。

其中一处最容易踩：反代 `X-Forwarded-For` 必须用 `$remote_addr` **覆盖**而不是 `$proxy_add_x_forwarded_for` 追加，否则客户端可伪造来源 IP 绕过校验接口的限流。
