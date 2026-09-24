import api from './index'

export function getAdminOverview() {
  return api.get('/admin/overview')
}

export function getAdminUsers(params) {
  return api.get('/admin/users', { params })
}

export function updateAdminUser(id, data) {
  return api.patch('/admin/users/' + id, data)
}

export function grantAdminUser(id) {
  return api.post('/admin/users/' + id + '/admin')
}

export function revokeAdminUser(id) {
  return api.delete('/admin/users/' + id + '/admin')
}

export function getAdminBetaApplications(status) {
  return api.get('/admin/beta-applications', { params: { status } })
}

export function addAdminBetaMember(data) {
  return api.post('/admin/beta-applications', data)
}

export function decideAdminBetaApplication(id, status) {
  return api.patch('/admin/beta-applications/' + id, { status })
}

export function getAdminBetaPlans() {
  return api.get('/admin/beta-plans')
}

export function createAdminBetaPlan(data) {
  return api.post('/admin/beta-plans', data)
}

export function updateAdminBetaPlan(id, data) {
  return api.put('/admin/beta-plans/' + id, data)
}

export function updateAdminBetaPlanStatus(id, status) {
  return api.patch('/admin/beta-plans/' + id + '/status', { status })
}

export function getAdminBetaWhitelist(params) {
  return api.get('/admin/beta/whitelist', { params })
}

export function createAdminBetaWhitelist(data) {
  return api.post('/admin/beta/whitelist', data)
}

export function updateAdminBetaWhitelist(id, data) {
  return api.put('/admin/beta/whitelist/' + id, data)
}

export function deleteAdminBetaWhitelist(id) {
  return api.delete('/admin/beta/whitelist/' + id)
}

export function importAdminBetaWhitelist(data) {
  return api.post('/admin/beta/whitelist/import', data)
}

export function importAdminBetaWhitelistCsv(text, replace = false) {
  return api.post('/admin/beta/whitelist/import-csv', text, {
    params: { replace },
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
  })
}

export function exportAdminBetaWhitelist() {
  return api.get('/admin/beta/whitelist/export', { responseType: 'blob' })
}

export function getAdminBetaVerifyLogs(params) {
  return api.get('/admin/beta/verify-logs', { params })
}

/**
 * 按账号状态重建白名单（对账）：
 * 为「已通过」的玩家补齐/更新条目，并清理已失去资格却仍在放行的系统条目。
 * 手工录入的条目不会被删除或修改。
 */
export function syncAdminBetaWhitelistAccounts() {
  return api.post('/admin/beta/whitelist/sync-accounts')
}

export function getAdminRooms() {
  return api.get('/admin/rooms')
}

export function getAdminMatches() {
  return api.get('/admin/matches')
}
