<template>
  <div class="home">
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-grid"></div>
      </div>
      <div class="hero-content container">
        <div class="hero-badge">MC 竞技平台</div>
        <h1 class="hero-title">
          <span class="hero-title-line">NORTH</span>
          <span class="hero-title-line accent">STAR</span>
        </h1>
        <p class="hero-subtitle">专为 Minecraft 玩家打造的竞技对战平台<br/>组队匹配 · 战绩追踪 · 实时排行</p>
        <div class="hero-actions">
          <router-link to="/lobby" class="ns-btn ns-btn-filled"><NsIcon name="joystick" /> 进入大厅</router-link>
          <router-link to="/stats" class="ns-btn"><NsIcon name="search" /> 查询战绩</router-link>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <span class="stat-number">{{ platformStats.onlinePlayers.toLocaleString() }}</span>
            <span class="stat-label">在线玩家</span>
          </div>
          <div class="hero-stat">
            <span class="stat-number">{{ platformStats.activeRooms.toLocaleString() }}</span>
            <span class="stat-label">进行中房间</span>
          </div>
          <div class="hero-stat">
            <span class="stat-number">{{ platformStats.totalMatches.toLocaleString() }}</span>
            <span class="stat-label">总对战场次</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features container">
      <h2 class="section-title">核心功能</h2>
      <div class="features-grid">
        <div class="feature-card ns-card" v-for="f in features" :key="f.title">
          <div class="feature-icon"><NsIcon :name="f.icon.replace('icon-', '')" /></div>
          <h3 class="feature-title">{{ f.title }}</h3>
          <p class="feature-desc">{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <section class="hot-rooms container">
      <h2 class="section-title">热门房间</h2>
      <div class="rooms-grid">
        <div class="room-card ns-card" v-for="r in hotRooms" :key="r.id">
          <div class="room-header">
            <span class="room-mode ns-tag">{{ r.mode }}</span>
            <span class="room-players"><NsIcon name="user" /> {{ r.players }}/{{ r.maxPlayers }}</span>
          </div>
          <h3 class="room-name">{{ r.name }}</h3>
          <p class="room-map"><NsIcon name="map" /> {{ r.map }}</p>
          <div class="room-footer">
            <span class="room-ping"><NsIcon name="signal" /> {{ r.ping }}ms</span>
            <button class="ns-btn" style="padding:6px 16px;font-size:12px"><NsIcon name="login" /> 加入</button>
          </div>
        </div>
      </div>
    </section>

    <section class="recent container">
      <h2 class="section-title">最新战报</h2>
      <div class="reports-list">
        <div class="report-item ns-card" v-for="r in recentReports" :key="r.id">
          <div class="report-result" :class="r.win ? 'win' : 'loss'">
            <NsIcon :name="r.win ? 'check-circle' : 'close-circle'" />
            {{ r.win ? '胜利' : '失败' }}
          </div>
          <div class="report-info">
            <span class="report-player"><NsIcon name="user" /> {{ r.username }}</span>
            <span class="report-mode">{{ r.mode }}</span>
            <span class="report-map"><NsIcon name="map" /> {{ r.map }}</span>
          </div>
          <div class="report-stats">
            <span><NsIcon name="crosshair" /> <strong>{{ r.kills }}</strong> 击杀</span>
            <span><NsIcon name="skull" /> <strong>{{ r.deaths }}</strong> 死亡</span>
            <span>K/D <strong>{{ r.kd }}</strong></span>
          </div>
          <div class="report-time"><NsIcon name="clock" /> {{ r.time }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getHotRooms } from '../api/rooms'
import { getRecentMatches } from '../api/matches'
import { getPlatformStats } from '../api/platform'

const platformStats = ref({ onlinePlayers: 0, activeRooms: 0, totalMatches: 0 })

const features = ref([
  { icon: 'icon-sword', title: '竞技匹配', desc: '智能ELO匹配系统，根据实力精准配对对手，让每场对战都势均力敌。' },
  { icon: 'icon-chart', title: '战绩追踪', desc: '详细记录每场数据：击杀、死亡、K/D、胜率，全方位分析你的成长轨迹。' },
  { icon: 'icon-trophy', title: '排行榜', desc: '实时更新全服排名，争夺巅峰荣耀，证明你是MC最强战士。' },
  { icon: 'icon-home', title: '房间系统', desc: '自定义房间参数、地图、模式，一键创建私人对战，邀请好友同台竞技。' }
])

const hotRooms = ref([])
const recentReports = ref([])

onMounted(async () => {
  try {
    const statsRes = await getPlatformStats()
    platformStats.value = statsRes.data
  } catch (e) { console.error('Failed to load platform stats:', e) }

  try {
    const roomRes = await getHotRooms()
    hotRooms.value = (roomRes.data || []).slice(0, 4)
  } catch (e) { console.error('Failed to load hot rooms:', e) }

  try {
    const matchRes = await getRecentMatches()
    recentReports.value = (matchRes.data || []).map(m => ({
      id: m.id, username: m.username, win: m.win, mode: m.mode, map: m.mapName,
      kills: m.kills, deaths: m.deaths, kd: m.kd, time: m.playedAt
    }))
  } catch (e) { console.error('Failed to load recent reports:', e) }
})
</script>

<style scoped>
.hero {
  position: relative;
  min-height: 600px;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,140,0,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,140,0,0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
}
.hero-content {
  position: relative;
  z-index: 1;
  padding: 80px 30px;
}
.hero-badge {
  display: inline-block;
  padding: 6px 18px;
  background: rgba(255,140,0,0.12);
  border: 1px solid rgba(255,140,0,0.3);
  color: var(--accent-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 24px;
}
.hero-title {
  font-family: 'Orbitron', monospace;
  font-size: 80px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 24px;
}
.hero-title-line {
  display: block;
  color: #fff;
  letter-spacing: 12px;
}
.hero-title-line.accent {
  color: var(--accent-primary);
  text-shadow: 0 0 40px var(--accent-glow), 0 0 80px rgba(255,140,0,0.2);
}
.hero-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 40px;
}
.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 60px;
}
.hero-actions .ns-icon {
  margin-right: 6px;
}
.hero-stats {
  display: flex;
  gap: 48px;
}
.hero-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hero-stat .stat-number {
  font-size: 32px;
}
.hero-stat .stat-label {
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.features {
  padding: 80px 30px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
.feature-card {
  text-align: center;
  padding: 40px 24px;
}
.feature-icon {
  margin-bottom: 20px;
}
.feature-icon .ns-icon {
  font-size: 48px;
  color: var(--accent-primary);
}
.feature-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 1px;
}
.feature-desc {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.7;
}
.hot-rooms {
  padding: 40px 30px 80px;
}
.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.room-players {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  color: var(--accent-green);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.room-players .ns-icon { font-size: 14px; }
.room-name {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}
.room-map {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.room-map .ns-icon { font-size: 14px; }
.room-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
.room-ping {
  font-size: 13px;
  color: var(--accent-green);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.room-ping .ns-icon { font-size: 14px; }
.recent {
  padding: 40px 30px 80px;
}
.reports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.report-item {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 18px 24px;
}
.report-result {
  padding: 6px 16px;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 1px;
  min-width: 80px;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 6px;
}
.report-result .ns-icon { font-size: 14px; }
.report-result.win {
  background: rgba(76,175,80,0.15);
  color: var(--accent-green);
  border: 1px solid rgba(76,175,80,0.3);
}
.report-result.loss {
  background: rgba(244,67,54,0.15);
  color: var(--accent-red);
  border: 1px solid rgba(244,67,54,0.3);
}
.report-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}
.report-player {
  font-weight: 700;
  font-size: 14px;
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}
.report-player .ns-icon { font-size: 13px; }
.report-mode {
  font-weight: 600;
  font-size: 15px;
}
.report-map {
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}
.report-map .ns-icon { font-size: 12px; }
.report-stats {
  display: flex;
  gap: 24px;
  flex: 1;
  font-size: 14px;
  color: var(--text-secondary);
}
.report-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}
.report-stats .ns-icon { font-size: 14px; color: var(--text-muted); }
.report-stats strong {
  color: var(--text-primary);
  font-weight: 700;
}
.report-time {
  font-size: 13px;
  color: var(--text-muted);
  min-width: 100px;
  text-align: right;
  display: flex;
  align-items: center;
  gap: 4px;
}
.report-time .ns-icon { font-size: 12px; }
@media (max-width: 640px) {
  .hero-content {
    padding: 60px 20px;
  }
  .hero-title {
    font-size: clamp(40px, 14vw, 80px);
    margin-bottom: 16px;
  }
  .hero-title-line {
    letter-spacing: 6px;
  }
  .hero-subtitle {
    font-size: 15px;
    margin-bottom: 28px;
  }
  .hero-actions {
    flex-wrap: wrap;
    margin-bottom: 40px;
  }
  .hero-stats {
    gap: 24px;
    flex-wrap: wrap;
  }
  .features {
    padding: 56px 20px;
  }
}
</style>