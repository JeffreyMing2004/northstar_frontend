import api from './index'

export function loginApi(data) {
  return api.post('/auth/login', data)
}

export function registerApi(data) {
  return api.post('/auth/register', data)
}

export function getProfile() {
  return api.get('/auth/profile')
}

export function updateProfileApi(data) {
  return api.put('/auth/profile', data)
}

export function sendCodeApi(email) {
  // 后端是同步发 SMTP（网易邮箱 465），弱网或对方限速时可能超过默认的 10s，
  // 单独放宽到 30s，避免前端先超时而后端其实已经发出验证码。
  return api.post('/auth/send-code', { email }, { timeout: 30000 })
}

export function bindGameApi(mcId) {
  return api.post('/auth/bind-game', { mcId })
}