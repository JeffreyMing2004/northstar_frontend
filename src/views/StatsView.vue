<template>
  <div class="stats container">
    <h1 class="section-title">战绩查询</h1>

    <div class="search-section">
      <div class="search-box">
        <div class="input-wrapper">
          <NsIcon name="search" class="input-icon-inner" />
          <input v-model="playerName" class="ns-input search-input"
            placeholder="输入玩家名称..." @keyup.enter="searchPlayer" />
        </div>
        <button class="ns-btn ns-btn-filled search-btn" @click="searchPlayer">
          <NsIcon name="search" /> 查询
        </button>
      </div>
    </div>

    <div v-if="player" class="player-profile">
      <div class="profile-header ns-card">
        <PlayerAvatar
          class="profile-avatar"
          :player-id="player.mcId || player.name"
          :label="player.name"
          :size="80"
        />
        <div class="profile-info">
          <router-link class="profile-name" :to="`/profile/${encodeURIComponent(player.mcId || player.name)}`">{{ player.name }}</router-link>
          <div class="profile-tags">
            <span class="ns-tag"><NsIcon name="medal" /> {{ player.rank }}</span>
            <span class="ns-tag-green ns-tag"><NsIcon name="flag" /> 赛季 {{ player.season }}</span>
          </div>
        </div>
        <div class="profile-score">
          <span class="stat-number" style="font-size:48px">{{ player.score }}</span>
          <span style="color:var(--text-muted);font-size:13px">综合评分</span>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card ns-card" v-for="s in statCards" :key="s.label">
          <div class="stat-card-icon"><NsIcon :name="s.icon.replace('icon-', '')" /></div>
          <div class="stat-card-value stat-number">{{ s.value }}</div>
          <div class="stat-card-label">{{ s.label }}</div>
          <div class="stat-card-bar">
            <div class="bar-fill" :style="{ width: s.pct + '%', background: s.color }"></div>
          </div>
        </div>
      </div>

      <div class="match-history">
        <h3 class="sub-title">近期对战</h3>
        <div class="match-list">
          <div class="match-item ns-card" v-for="m in matches" :key="m.id">
            <div class="match-result" :class="m.win ? 'win' : 'loss'">
              <NsIcon :name="m.win ? 'check-circle' : 'close-circle'" />
              {{ m.win ? 'WIN' : 'LOSS' }}
            </div>
            <div class="match-detail">
              <span class="match-mode">{{ m.mode }}</span>
              <span class="match-map"><NsIcon name="map" /> {{ m.map }}</span>
            </div>
            <div class="match-kda">
              <span><NsIcon name="crosshair" /> {{ m.kills }}/{{ m.deaths }}/{{ m.assists }}</span>
            </div>
            <div class="match-kd">K/D <strong>{{ m.kd }}</strong></div>
            <div class="match-time"><NsIcon name="clock" /> {{ m.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="error" class="error-state">
      <div class="empty-icon"><NsIcon name="warning" size="64" color="#f44336" /></div>
      <p style="color:#f44336">{{ error }}</p>
    </div>
    <div v-else-if="!player" class="empty-state">
      <div class="empty-icon"><NsIcon name="search" /></div>
      <p>输入玩家名称开始查询战绩</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getPlayerStats } from '../api/stats'
import PlayerAvatar from '../components/PlayerAvatar.vue'

const playerName = ref('')
const player = ref(null)
const statCards = ref([])
const matches = ref([])
const loading = ref(false)
const error = ref('')

async function searchPlayer() {
  if (!playerName.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    const res = await getPlayerStats(playerName.value.trim())
    const d = res.data
    player.value = { id: d.id, name: d.name, mcId: d.mcId, score: d.score, rank: d.rank, season: d.season }
    const maxKills = Math.max(d.totalKills, 1)
    const maxDeaths = Math.max(d.totalDeaths, 1)
    const maxGames = Math.max(d.totalGames, 1)
    statCards.value = [
      { label: '总击杀', value: d.totalKills.toLocaleString(), pct: Math.min(100, Math.round(d.totalKills / maxKills * 100)), color: 'var(--accent-primary)', icon: 'icon-crosshair' },
      { label: '总死亡', value: d.totalDeaths.toLocaleString(), pct: Math.min(100, Math.round(d.totalDeaths / maxDeaths * 100)), color: 'var(--accent-red)', icon: 'icon-skull' },
      { label: 'K/D 比', value: d.kd, pct: Math.min(100, Math.round(parseFloat(d.kd) / 5 * 100)), color: 'var(--accent-green)', icon: 'icon-chart' },
      { label: '胜率', value: d.winRate + '%', pct: d.winRate, color: 'var(--accent-blue)', icon: 'icon-percent' },
      { label: '总场次', value: d.totalGames.toLocaleString(), pct: Math.min(100, Math.round(d.totalGames / maxGames * 100)), color: 'var(--accent-primary)', icon: 'icon-gamepad' },
      { label: '最高击杀', value: String(d.highestKills), pct: Math.min(100, Math.round(d.highestKills / 50 * 100)), color: '#ffc107', icon: 'icon-fire' }
    ]
    matches.value = (d.recentMatches || []).map(m => ({
      id: m.id,
      win: m.win,
      mode: m.mode,
      map: m.mapName,
      kills: m.kills,
      deaths: m.deaths,
      assists: m.assists,
      kd: m.kd,
      time: m.playedAt
    }))
  } catch (e) {
    error.value = e.response?.data?.message || '未找到该玩家'
    player.value = null
  } finally { loading.value = false }
}
</script>

<style scoped>
.stats { padding: 40px 30px 80px; }
.search-section { margin: 32px 0; }
.search-box { display: flex; gap: 12px; max-width: 600px; }
.input-wrapper { display: flex; align-items: center; flex: 1; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); transition: all 0.3s; }
.input-wrapper:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 20px rgba(255,140,0,0.1); }
.input-icon-inner { padding: 0 14px; font-size: 16px; color: var(--text-muted); }
.search-input { flex: 1; border: none !important; background: transparent !important; box-shadow: none !important; padding-left: 0; }
.search-btn { white-space: nowrap; }
.search-btn .ns-icon { margin-right: 4px; }
.player-profile { animation: fadeInUp 0.5s ease-out; }
.profile-header { display: flex; align-items: center; gap: 24px; padding: 32px; margin-bottom: 32px; }
.profile-avatar { width: 80px; height: 80px; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 900; color: #000; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); }
.profile-info { flex: 1; }
.profile-name { display: block; color: var(--text-primary); font-size: 28px; font-weight: 800; margin-bottom: 8px; }
.profile-name:hover { color: var(--accent-primary); }
.profile-tags { display: flex; gap: 8px; }
.profile-tags .ns-icon { margin-right: 4px; font-size: 13px; }
.profile-score { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 40px; }
.stat-card { text-align: center; padding: 24px; }
.stat-card-icon .ns-icon { font-size: 24px; color: var(--text-muted); }
.stat-card-value { font-size: 32px; margin: 8px 0; }
.stat-card-label { font-size: 13px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
.stat-card-bar { height: 4px; background: rgba(255,255,255,0.06); overflow: hidden; }
.bar-fill { height: 100%; transition: width 1s ease; }
.sub-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; letter-spacing: 1px; }
.match-list { display: flex; flex-direction: column; gap: 10px; }
.match-item { display: flex; align-items: center; gap: 20px; padding: 16px 24px; }
.match-result { padding: 6px 14px; font-weight: 800; font-size: 12px; letter-spacing: 1px; min-width: 70px; text-align: center; display: flex; align-items: center; gap: 6px; }
.match-result .ns-icon { font-size: 14px; }
.match-result.win { background: rgba(76,175,80,0.15); color: var(--accent-green); border: 1px solid rgba(76,175,80,0.3); }
.match-result.loss { background: rgba(244,67,54,0.15); color: var(--accent-red); border: 1px solid rgba(244,67,54,0.3); }
.match-detail { display: flex; flex-direction: column; gap: 2px; min-width: 120px; }
.match-mode { font-weight: 600; font-size: 14px; }
.match-map { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.match-map .ns-icon { font-size: 12px; }
.match-kda { font-family: 'Orbitron', monospace; font-size: 15px; min-width: 120px; }
.match-kda span { display: flex; align-items: center; gap: 6px; }
.match-kda .ns-icon { font-size: 14px; color: var(--text-muted); }
.match-kd { font-size: 14px; color: var(--text-secondary); min-width: 80px; }
.match-kd strong { color: var(--accent-primary); }
.match-time { font-size: 13px; color: var(--text-muted); margin-left: auto; display: flex; align-items: center; gap: 4px; }
.match-time .ns-icon { font-size: 12px; }
.empty-state { text-align: center; padding: 100px 0; color: var(--text-muted); }
.empty-icon { margin-bottom: 20px; }
.empty-icon .ns-icon { font-size: 64px; }
</style>
