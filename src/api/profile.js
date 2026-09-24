import { getLeaderboard, getPlayerProfile, getPlayerStats } from './stats'

export async function loadPlayerProfile(playerId) {
  try {
    const res = await getPlayerProfile(playerId)
    return res.data
  } catch (primaryError) {
    try {
      const statsRes = await getPlayerStats(playerId)
      return statsRes.data
    } catch {
      const leaderboardRes = await getLeaderboard()
      const entry = (leaderboardRes.data || []).find(item =>
        item.playerId === playerId || item.name === playerId
      )
      if (entry?.name && entry.name !== playerId) {
        const statsRes = await getPlayerStats(entry.name)
        return statsRes.data
      }
      throw primaryError
    }
  }
}
