<template>
  <div class="profile-page container">
    <div v-if="loading" class="profile-state">
      <NsIcon name="refresh" :size="34" />
      <p>正在加载玩家主页</p>
    </div>

    <div v-else-if="error" class="profile-state error-state">
      <NsIcon name="warning" :size="42" />
      <h1>无法打开该玩家主页</h1>
      <p>{{ error }}</p>
      <router-link to="/leaderboard" class="ns-btn">
        <NsIcon name="arrow-left" /> 返回排行榜
      </router-link>
    </div>

    <template v-else-if="player">
      <header class="profile-hero">
        <PlayerAvatar
          class="profile-avatar"
          :player-id="player.mcId || player.name"
          :label="player.name"
          :size="96"
        />
        <div class="profile-identity">
          <span class="profile-eyebrow">PLAYER PROFILE</span>
          <h1>{{ player.name }}</h1>
          <div class="profile-ids">
            <span>玩家 ID：{{ player.mcId || player.name }}</span>
            <span v-if="player.mcId && player.mcId !== player.name">平台账号：{{ player.name }}</span>
          </div>
        </div>
        <div class="rank-summary">
          <NsIcon name="medal" :size="34" />
          <div>
            <span class="rank-label">当前段位</span>
            <strong>{{ player.rank }}</strong>
          </div>
          <span class="rank-score stat-number">{{ player.score }}</span>
        </div>
      </header>

      <section class="performance" aria-label="赛季数据">
        <div class="performance-item">
          <span class="performance-label">总场次</span>
          <strong class="stat-number">{{ player.totalGames }}</strong>
        </div>
        <div class="performance-item">
          <span class="performance-label">胜率</span>
          <strong class="stat-number">{{ player.winRate }}%</strong>
        </div>
        <div class="performance-item">
          <span class="performance-label">K/D</span>
          <strong class="stat-number">{{ player.kd }}</strong>
        </div>
        <div class="performance-item">
          <span class="performance-label">最高击杀</span>
          <strong class="stat-number">{{ player.highestKills }}</strong>
        </div>
      </section>

      <section class="recent-section">
        <div class="section-heading">
          <div>
            <span class="section-kicker">MATCH HISTORY</span>
            <h2>近期战绩</h2>
          </div>
          <div class="section-actions">
            <span class="match-count">最近 {{ matches.length }} 场</span>
            <router-link :to="`/profile/${encodeURIComponent(player.mcId || player.name)}/stats`" class="ns-btn stats-link">
              查看完整战绩 <NsIcon name="arrow-right" />
            </router-link>
          </div>
        </div>

        <div v-if="matches.length" class="match-list">
          <article v-for="match in matches" :key="match.id" class="match-row">
            <div :class="['result-mark', match.win ? 'win' : 'loss']">
              <NsIcon :name="match.win ? 'check-circle' : 'close-circle'" />
              <span>{{ match.win ? '胜利' : '失败' }}</span>
            </div>

            <div class="match-mode">
              <strong>{{ match.mode }}</strong>
              <span><NsIcon name="map" /> {{ match.mapName }}</span>
            </div>

            <div class="kda" aria-label="击杀、死亡、助攻">
              <span class="kda-value">{{ match.kills }} / {{ match.deaths }} / {{ match.assists }}</span>
              <span class="kda-label">击杀 / 死亡 / 助攻</span>
            </div>

            <div class="match-rating">
              <span>K/D {{ match.kd }}</span>
              <strong :class="match.scoreChange >= 0 ? 'score-up' : 'score-down'">
                {{ match.scoreChange >= 0 ? '+' : '' }}{{ match.scoreChange }}
              </strong>
            </div>

            <time>{{ match.playedAt }}</time>
          </article>
        </div>

        <div v-else class="match-empty">
          <NsIcon name="gamepad" :size="34" />
          <p>该玩家还没有近期对局记录</p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { loadPlayerProfile } from '../api/profile'
import PlayerAvatar from '../components/PlayerAvatar.vue'

const props = defineProps({
  playerId: {
    type: String,
    required: true
  }
})

const player = ref(null)
const loading = ref(false)
const error = ref('')
const matches = computed(() => player.value?.recentMatches || [])

async function loadProfile() {
  loading.value = true
  error.value = ''
  player.value = null
  try {
    player.value = await loadPlayerProfile(props.playerId)
    document.title = `${player.value.name} - NorthStar 个人主页`
  } catch (e) {
    const status = e.response?.status
    if (status === 404 || e.response?.data?.code === 404) {
      error.value = '未找到该玩家'
    } else if (status) {
      error.value = '个人主页服务暂时不可用，请稍后重试'
    } else {
      error.value = '网络连接失败，请检查网络后重试'
    }
  } finally {
    loading.value = false
  }
}

watch(() => props.playerId, loadProfile, { immediate: true })
</script>

<style scoped>
.profile-page {
  padding-top: 48px;
  padding-bottom: 88px;
}

.profile-state {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-muted);
  text-align: center;
}

.profile-state h1 {
  color: var(--text-primary);
  font-size: 24px;
}

.profile-state .ns-btn {
  margin-top: 12px;
}

.error-state .ns-icon,
.error-state h1 {
  color: var(--accent-red);
}

.profile-hero {
  min-height: 190px;
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) auto;
  align-items: center;
  gap: 28px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 34px;
}

.profile-avatar {
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-primary);
  color: #080808;
  font-family: 'Orbitron', sans-serif;
  font-size: 42px;
  font-weight: 900;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.profile-identity {
  min-width: 0;
}

.profile-eyebrow,
.section-kicker {
  color: var(--accent-primary);
  font-family: 'Orbitron', sans-serif;
  font-size: 11px;
  font-weight: 700;
}

.profile-identity h1 {
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  font-size: 34px;
  margin: 8px 0 12px;
  overflow-wrap: anywhere;
}

.profile-ids {
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 13px;
  gap: 18px;
}

.rank-summary {
  min-width: 250px;
  display: grid;
  grid-template-columns: 42px minmax(90px, 1fr) auto;
  align-items: center;
  gap: 14px;
  border-left: 1px solid var(--border-color);
  padding-left: 28px;
}

.rank-summary > .ns-icon {
  color: var(--accent-primary);
}

.rank-summary div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rank-label {
  color: var(--text-muted);
  font-size: 12px;
}

.rank-summary strong {
  color: var(--text-primary);
  font-size: 21px;
}

.rank-score {
  font-size: 25px;
}

.performance {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--border-color);
}

.performance-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 30px 26px;
  border-right: 1px solid var(--border-color);
}

.performance-item:last-child {
  border-right: 0;
}

.performance-label {
  color: var(--text-muted);
  font-size: 12px;
}

.performance-item strong {
  font-size: 30px;
  overflow-wrap: anywhere;
}

.recent-section {
  padding-top: 44px;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.section-heading h2 {
  font-size: 23px;
  margin-top: 7px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.match-count {
  color: var(--text-muted);
  font-size: 13px;
}

.stats-link {
  padding: 8px 14px;
  font-size: 12px;
}

.stats-link .ns-icon {
  font-size: 13px;
}

.match-list {
  border-top: 1px solid var(--border-color);
}

.match-row {
  min-height: 92px;
  display: grid;
  grid-template-columns: 88px minmax(150px, 1fr) minmax(190px, 0.8fr) minmax(150px, 0.7fr) 135px;
  align-items: center;
  gap: 22px;
  border-bottom: 1px solid var(--border-color);
  padding: 18px 4px;
}

.result-mark {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 800;
}

.result-mark.win {
  color: var(--accent-green);
}

.result-mark.loss {
  color: var(--accent-red);
}

.match-mode {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.match-mode strong {
  font-size: 15px;
}

.match-mode span {
  color: var(--text-muted);
  display: flex;
  align-items: center;
  font-size: 12px;
  gap: 5px;
}

.kda,
.match-rating {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.kda-value {
  font-family: 'Orbitron', monospace;
  font-size: 16px;
}

.kda-label,
.match-rating span,
.match-row time {
  color: var(--text-muted);
  font-size: 11px;
}

.match-rating strong {
  font-family: 'Orbitron', monospace;
  font-size: 16px;
}

.score-up {
  color: var(--accent-green);
}

.score-down {
  color: var(--accent-red);
}

.match-row time {
  text-align: right;
}

.match-empty {
  min-height: 180px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
}

@media (max-width: 900px) {
  .profile-hero {
    grid-template-columns: 76px minmax(0, 1fr);
  }

  .profile-avatar {
    width: 76px;
    height: 76px;
    font-size: 32px;
  }

  .rank-summary {
    grid-column: 1 / -1;
    border-left: 0;
    border-top: 1px solid var(--border-color);
    padding: 22px 0 0;
  }

  .performance {
    grid-template-columns: repeat(2, 1fr);
  }

  .performance-item:nth-child(2) {
    border-right: 0;
  }

  .performance-item:nth-child(-n + 2) {
    border-bottom: 1px solid var(--border-color);
  }

  .match-row {
    grid-template-columns: 80px minmax(130px, 1fr) minmax(150px, 1fr);
  }

  .match-rating,
  .match-row time {
    grid-column: auto;
    text-align: left;
  }
}

@media (max-width: 620px) {
  .profile-page {
    padding-top: 30px;
  }

  .profile-hero {
    grid-template-columns: 1fr;
  }

  .profile-identity h1 {
    font-size: 27px;
  }

  .section-actions {
    align-items: flex-end;
    flex-direction: column;
    gap: 10px;
  }

  .rank-summary {
    grid-template-columns: 38px minmax(80px, 1fr) auto;
  }

  .performance {
    grid-template-columns: 1fr 1fr;
  }

  .performance-item {
    padding: 22px 16px;
  }

  .performance-item strong {
    font-size: 24px;
  }

  .match-row {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .result-mark,
  .match-mode,
  .kda,
  .match-rating {
    grid-column: auto;
  }

  .match-row time {
    grid-column: 1 / -1;
    text-align: left;
  }
}
</style>
