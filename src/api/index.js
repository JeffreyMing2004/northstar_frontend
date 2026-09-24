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

// Response interceptor: unwrap ApiResponse { code, message, data }
api.interceptors.response.use(
  res => res.data,
  err => {
    const status = err.response?.status
    const hasToken = !!localStorage.getItem('ns_token')
    if (status === 401 && hasToken) {
      useAuth().logout()
      if (router.currentRoute.value.path !== '/auth/login') router.push('/auth/login')
    }
    if (status === 403) {
      err.userMessage = '当前账号没有访问该功能的权限'
    }
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export default api
