import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  // 只用于本地开发：把 /api 转发到 VITE_DEV_PROXY_TARGET（默认本机 8080）。
  // 生产构建用不到 dev server —— 线上请求由 OpenResty 反代，见 deploy/ 目录。
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  }
})
