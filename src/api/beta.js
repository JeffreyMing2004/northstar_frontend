import api from './index'

export function checkBeta(query) {
  return api.get('/beta/check', { params: { query } })
}

export function getBetaPlans() {
  return api.get('/beta/plans')
}

export function applyBeta(data) {
  // 必须登录：后端从 JWT 里取账号，申请记录里的 QQ / 游戏 ID 都由账号决定，
  // 所以这里不再传「查询用的账号标识」。见 BetaService#applyForBeta。
  return api.post('/beta/apply', data)
}

/** 当前登录账号最近一次的内测申请状态（未登录会 403）。 */
export function getMyBetaApplication() {
  return api.get('/beta/my-application')
}
