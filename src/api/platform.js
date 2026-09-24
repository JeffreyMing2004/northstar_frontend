import api from "./index"

export function getPlatformStats() {
  return api.get("/platform/stats")
}
