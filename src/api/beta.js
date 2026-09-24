import api from './index'

export function checkBeta(query) {
  return api.get('/beta/check', { params: { query } })
}

export function getBetaPlans() {
  return api.get('/beta/plans')
}

export function applyBeta(data) {
  return api.post('/beta/apply', data)
}
