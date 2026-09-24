<template>
  <div class="profile-stats-page container">
    <div v-if="loading" class="page-state">
      <NsIcon name="refresh" :size="34" />
      <p>正在加载战绩数据</p>
    </div>

    <div v-else-if="error" class="page-state error-state">
      <NsIcon name="warning" :size="42" />
      <h1>无法打开该玩家战绩</h1>
      <p>{{ error }}</p>
      <router-link :to="`/profile/${encodeURIComponent(playerId)}`" class="ns-btn">
        <NsIcon name="arrow-left" /> 返回个人主页
      </router-link>
    </div>

    <template v-else-if="player">
      <header class="stats-header">
        <router-link :to="`/profile/${encodeURIComponent(player.mcId || player.name)}`" class="back-link">
          <NsIcon name="arrow-left" /> 个人主页
        </router-link>
        <div class="stats-heading">
          <span class="section-kicker">PLAYER STATS</span>
          <h1>{{ player.name }} 的战绩</h1>
        </div>
        <router-link :to="`/profile/${encodeURIComponent(player.mcId || player.name)}`" class="outline-link">
          查看主页 <NsIcon name="arrow-right" />
        </router-link>
      </header>

      <section class="player-strip">
        <PlayerAvatar
          class="stats-avatar"
          :player-id="player.mcId || player.name"
          :label="player.name"
          :size="72"
        />
        <div class="player-summary">
          <h2>{{ player.name }}</h2>
          <div class="player-meta">
            <span><NsIcon name="medal" /> {{ player.rank }}</span>
            <span><NsIcon name="flag" /> {{ player.season }}</span>
          </div>
        </div>
        <div class="score-summary">
          <strong class="stat-number">{{ player.score }}</strong>
          <span>当前评分</span>
        </div>
      </section>

      <section class="metrics-grid" aria-label="战绩统计">
        <article v-for="metric in metrics" :key="metric.label" class="metric">
          <NsIcon :name="metric.icon" :size="22" />
          <strong class="stat-number">{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
        </article>
      </section>

      <section class="history-section">
        <div class="history-heading">
          <div>
            <span class="section-kicker">RECENT MATCHES</span>
            <h2>近期对局</h2>
          </div>
          <span class="history-count">{{ matches.length ? `最近 ${matches.length} 场` : '暂无记录' }}</span>
        </div>

        <div v-if="matches.length" class="history-table">
          <article v-for="match in matches" :key="match.id" class="history-row">
            <div :class="['result-label', match.win ? 'win' : 'loss']">
              <NsIcon :name="match.win ? 'check-circle' : 'close-circle'" />
              {{ match.win ? '胜利' : '失败' }}
            </div>

            <div class="match-info">
              <strong>{{ match.mode }}</strong>
              <span><NsIcon name="map" /> {{ match.mapName }}</span>
            </div>

            <div class="match-kda">
              <strong>{{ match.kills }} / {{ match.deaths }} / {{ match.assists }}</strong>
              <span>击杀 / 死亡 / 助攻</span>
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

        <div v-else class="history-empty">
          <NsIcon name="gamepad" :size="34" />
          <p>该玩家还没有战绩记录</p>
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

const metrics = computed(() => {
  if (!player.value) return []
  const totalGames = player.value.totalGames || 0
  const wins = player.value.wins ?? Math.round(totalGames * (player.value.winRate || 0) / 100)
  const losses = player.value.losses ?? Math.max(0, totalGames - wins)
  return [
    { label: '总场次', value: totalGames.toLocaleString(), icon: 'gamepad' },
    { label: '胜利', value: wins.toLocaleString(), icon: 'check-circle' },
    { label: '失败', value: losses.toLocaleString(), icon: 'close-circle' },
    { label: '胜率', value: `${player.value.winRate || 0}%`, icon: 'percent' },
    { label: '总击杀', value: (player.value.totalKills || 0).toLocaleString(), icon: 'crosshair' },
    { label: '总死亡', value: (player.value.totalDeaths || 0).toLocaleString(), icon: 'skull' },
    { label: 'K/D', value: player.value.kd || '0', icon: 'chart' },
    { label: '最高击杀', value: String(player.value.highestKills || 0), icon: 'fire' }
  ]
})

async function loadStats() {
  loading.value = true
  error.value = ''
  player.value = null
  try {
    player.value = await loadPlayerProfile(props.playerId)
    document.title = `${player.value.name} 的战绩 - NorthStar`
  } catch (e) {
    const status = e.response?.status
    if (status === 404 || e.response?.data?.code === 404) {
      error.value = '未找到该玩家'
    } else if (status) {
      error.value = '战绩服务暂时不可用，请稍后重试'
    } else {
      error.value = '网络连接失败，请检查网络后重试'
    }
  } finally {
    loading.value = false
  }
}

watch(() => props.playerId, loadStats, { immediate: true })
</script>

<style scoped>
.profile-stats-page {
  padding-top: 44px;
  padding-bottom: 88px;
}

.page-state {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--text-muted);
  text-align: center;
}

.page-state h1 {
  color: var(--text-primary);
  font-size: 24px;
}

.page-state .ns-btn {
  margin-top: 12px;
}

.error-state .ns-icon,
.error-state h1 {
  color: var(--accent-red);
}

.stats-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 28px;
}

.back-link,
.outline-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.back-link:hover,
.outline-link:hover {
  color: var(--accent-primary);
}

.outline-link {
  justify-self: end;
}

.stats-heading {
  text-align: center;
}

.stats-heading h1 {
  font-family: 'Orbitron', 'Microsoft YaHei', sans-serif;
  font-size: 31px;
  margin-top: 9px;
}

.player-strip {
  min-height: 150px;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 22px;
  border-bottom: 1px solid var(--border-color);
  padding: 28px 0;
}

.stats-avatar {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}

.player-summary h2 {
  font-size: 23px;
  margin-bottom: 10px;
}

.player-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  color: var(--text-muted);
  font-size: 13px;
}

.player-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.score-summary {
  display: flex;
  flex-direction: column;
  align-items: end;
  gap: 5px;
}

.score-summary strong {
  font-size: 38px;
}

.score-summary span {
  color: var(--text-muted);
  font-size: 12px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--border-color);
}

.metric {
  min-height: 126px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 22px;
  border-right: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.metric:nth-child(4n) {
  border-right: 0;
}

.metric:nth-last-child(-n + 4) {
  border-bottom: 0;
}

.metric .ns-icon {
  color: var(--accent-primary);
}

.metric strong {
  font-size: 26px;
}

.metric span {
  color: var(--text-muted);
  font-size: 12px;
}

.history-section {
  padding-top: 44px;
}

.history-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.history-heading h2 {
  font-size: 23px;
  margin-top: 7px;
}

.history-count {
  color: var(--text-muted);
  font-size: 13px;
}

.history-table {
  border-top: 1px solid var(--border-color);
}

.history-row {
  min-height: 86px;
  display: grid;
  grid-template-columns: 88px minmax(150px, 1fr) minmax(190px, 0.8fr) minmax(140px, 0.7fr) 135px;
  align-items: center;
  gap: 22px;
  border-bottom: 1px solid var(--border-color);
  padding: 16px 4px;
}

.result-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 800;
}

.result-label.win {
  color: var(--accent-green);
}

.result-label.loss {
  color: var(--accent-red);
}

.match-info,
.match-kda,
.match-rating {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.match-info strong {
  font-size: 15px;
}

.match-info span,
.match-kda span,
.match-rating span,
.history-row time {
  color: var(--text-muted);
  font-size: 11px;
}

.match-info span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.match-kda strong,
.match-rating strong {
  font-family: 'Orbitron', monospace;
  font-size: 15px;
}

.score-up {
  color: var(--accent-green);
}

.score-down {
  color: var(--accent-red);
}

.history-row time {
  text-align: right;
}

.history-empty {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metric:nth-child(4n) {
    border-right: 1px solid var(--border-color);
  }

  .metric:nth-child(2n) {
    border-right: 0;
  }

  .metric:nth-last-child(-n + 4) {
    border-bottom: 1px solid var(--border-color);
  }

  .metric:nth-last-child(-n + 2) {
    border-bottom: 0;
  }

  .history-row {
    grid-template-columns: 82px minmax(130px, 1fr) minmax(150px, 1fr);
  }

  .match-rating,
  .history-row time {
    text-align: left;
  }
}

@media (max-width: 620px) {
  .profile-stats-page {
    padding-top: 30px;
  }

  .stats-header {
    grid-template-columns: 1fr auto;
  }

  .stats-heading {
    grid-column: 1 / -1;
    grid-row: 1;
    text-align: left;
  }

  .back-link {
    grid-row: 2;
  }

  .outline-link {
    grid-row: 2;
  }

  .stats-heading h1 {
    font-size: 25px;
  }

  .player-strip {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .score-summary {
    grid-column: 1 / -1;
    align-items: start;
    border-top: 1px solid var(--border-color);
    padding-top: 18px;
  }

  .metrics-grid {
    grid-template-columns: 1fr 1fr;
  }

  .metric {
    padding: 18px 14px;
  }

  .metric strong {
    font-size: 21px;
  }

  .history-row {
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .result-label,
  .match-info,
  .match-kda,
  .match-rating {
    grid-column: auto;
  }

  .history-row time {
    grid-column: 1 / -1;
    text-align: left;
  }
}
</style>
