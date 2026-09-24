import api from './index'

export function getLeaderboard() {
  return api.get('/leaderboard')
}

export function getPlayerStats(username) {
  return api.get('/stats/' + encodeURIComponent(username))
}

export function getPlayerProfile(playerId) {
  return api.get('/profile/' + encodeURIComponent(playerId))
}
