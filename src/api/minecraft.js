import api from './index'

export function getMinecraftAvatar(playerId) {
  return api.get('/minecraft/avatar/' + encodeURIComponent(playerId))
}
