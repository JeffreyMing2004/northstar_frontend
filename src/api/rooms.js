import api from './index'

export function getRooms(params) {
  return api.get('/rooms', { params })
}

export function getHotRooms() {
  return api.get('/rooms/hot')
}
