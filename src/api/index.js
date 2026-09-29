import axios from 'axios'
import { useAuth } from '../stores/auth'
import router from '../router'

// API 基地址由环境变量决定（见 .env.development / .env.production / .env.example）。
// 默认 '/api' 表示与前端同源：开发时由 vite dev proxy 转发，线上由 OpenResty 反代，
// 两种情况都不产生跨域。Vite 会在构建时把 import.meta.env.VITE_API_BASE_URL 替换成字面量。
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor: attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ns_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

/**
 * 从 axios 错误里取出可直接展示给用户的文案。
 *
 * 优先用拦截器根据 HTTP 状态给的通用文案（限流、掉登录态、断网），
 * 其次用后端 ApiResponse.message —— 后端的业务提示通常更具体（例如「验证码错误或已过期」），
 * 但限流这类场景后端只会回一句通用话术，前端补上「多久后可以再试」体验更好。
 */
export function messageOf(err, fallback = '操作失败，请稍后重试') {
  return err?.userMessage || err?.response?.data?.message || fallback
}

/** 把 Retry-After / 后端剩余秒数渲染成「请 N 秒后重试」。 */
function retryHint(seconds) {
  const value = Number(seconds)
  if (!Number.isFinite(value) || value <= 0) return ''
  if (value < 60) return `，请 ${Math.ceil(value)} 秒后重试`
  return `，请 ${Math.ceil(value / 60)} 分钟后重试`
}

// Response interceptor: unwrap ApiResponse { code, message, data }
api.interceptors.response.use(
  res => res.data,
  err => {
    const status = err.response?.status
    const hasToken = !!localStorage.getItem('ns_token')
    // 后端在重置密码 / 管理员改密后会按「用户 × 签发时间」吊销存量令牌（NS-01），
    // 因此这里的 401 除了过期，也可能是「密码已变更」，统一按掉登录态处理。
    if (status === 401 && hasToken) {
      err.userMessage = '登录状态已失效，请重新登录'
      useAuth().logout()
      if (router.currentRoute.value.path !== '/auth/login') router.push('/auth/login')
    }
    if (status === 403) {
      err.userMessage = '当前账号没有访问该功能的权限'
    }
    if (status === 429) {
      // 认证类接口（登录 / 发码 / 找回 / 重置）与公开查询接口都加了限流，
      // 后端会带 Retry-After；拿不到就退回一句通用提示，避免露出原始报错。
      const retryAfter = err.response?.headers?.['retry-after']
      err.userMessage = '操作过于频繁' + retryHint(retryAfter || err.response?.data?.data?.retryAfterSeconds)
    }
    if (!err.response) {
      err.userMessage = err.code === 'ECONNABORTED'
        ? '请求超时，请检查网络后重试'
        : '网络连接失败，请检查网络后重试'
    }
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export default api
