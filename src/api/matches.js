import api from './index'

export function getRecentMatches() {
  return api.get('/matches/recent')
}
