<template>
  <div class="leaderboard container">
    <div class="page-header">
      <h1 class="section-title">排行榜</h1>
      <div class="lb-tabs">
        <button v-for="t in tabs" :key="t.key"
          :class="['tab-btn', { active: activeTab === t.key }]"
          @click="activeTab = t.key">{{ t.label }}</button>
      </div>
    </div>

    <div class="lb-content">
      <div class="lb-podium">
        <div class="podium-item second" v-if="ranked[1]">
          <div class="podium-rank">2</div>
          <PlayerAvatar class="podium-avatar" :player-id="ranked[1].playerId || ranked[1].name" :label="ranked[1].name" :size="56" />
          <router-link class="podium-name" :to="`/profile/${encodeURIComponent(ranked[1].playerId || ranked[1].name)}`">{{ ranked[1].name }}</router-link>
          <div class="podium-score stat-number">{{ ranked[1].score }}</div>
        </div>
        <div class="podium-item first" v-if="ranked[0]">
          <div class="podium-crown"><NsIcon name="crown" /></div>
          <div class="podium-rank">1</div>
          <PlayerAvatar class="podium-avatar" :player-id="ranked[0].playerId || ranked[0].name" :label="ranked[0].name" :size="72" />
          <router-link class="podium-name" :to="`/profile/${encodeURIComponent(ranked[0].playerId || ranked[0].name)}`">{{ ranked[0].name }}</router-link>
          <div class="podium-score stat-number">{{ ranked[0].score }}</div>
        </div>
        <div class="podium-item third" v-if="ranked[2]">
          <div class="podium-rank">3</div>
          <PlayerAvatar class="podium-avatar" :player-id="ranked[2].playerId || ranked[2].name" :label="ranked[2].name" :size="56" />
          <router-link class="podium-name" :to="`/profile/${encodeURIComponent(ranked[2].playerId || ranked[2].name)}`">{{ ranked[2].name }}</router-link>
          <div class="podium-score stat-number">{{ ranked[2].score }}</div>
        </div>
      </div>

      <table class="ns-table lb-table">
        <thead>
          <tr>
            <th>排名</th>
            <th>玩家</th>
            <th>分数</th>
            <th>胜率</th>
            <th>K/D</th>
            <th>场次</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in ranked" :key="p.name">
            <td class="rank-cell">
              <span :class="['rank-badge', 'rank-' + (i+1)]">{{ i + 1 }}</span>
            </td>
            <td class="player-cell">
              <PlayerAvatar class="player-avatar" :player-id="p.playerId || p.name" :label="p.name" :size="36" />
              <router-link class="player-name" :to="`/profile/${encodeURIComponent(p.playerId || p.name)}`">{{ p.name }}</router-link>
            </td>
            <td><span class="stat-number" style="font-size:16px">{{ p.score }}</span></td>
            <td>
              <span :class="p.winRate >= 60 ? 'text-green' : p.winRate >= 45 ? 'text-yellow' : 'text-red'">
                {{ p.winRate }}%
              </span>
            </td>
            <td>{{ p.kd }}</td>
            <td style="color:var(--text-muted)">{{ p.games }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getLeaderboard } from '../api/stats'
import PlayerAvatar from '../components/PlayerAvatar.vue'

const activeTab = ref('rating')
const tabs = [
  { key: 'rating', label: '综合评分' },
  { key: 'kills', label: '击杀榜' },
  { key: 'winrate', label: '胜率榜' }
]

const players = ref([])
const loading = ref(false)

const ranked = computed(() => [...players.value].sort((a, b) => b.score - a.score))

onMounted(async () => {
  loading.value = true
  try {
    const res = await getLeaderboard()
    players.value = res.data
  } catch (e) {
    console.error('Failed to load leaderboard:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.leaderboard { padding: 40px 30px 80px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
.lb-tabs { display: flex; gap: 4px; }
.tab-btn {
  background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary);
  padding: 10px 20px; font-weight: 600; font-size: 13px; letter-spacing: 1px; cursor: pointer; transition: all 0.3s;
}
.tab-btn.active { background: rgba(255,140,0,0.12); border-color: var(--accent-primary); color: var(--accent-primary); }
.lb-podium { display: flex; justify-content: center; align-items: flex-end; gap: 24px; margin-bottom: 48px; padding: 40px 0; }
.podium-item { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border-color); min-width: 180px; }
.podium-item.first { border-color: var(--accent-primary); box-shadow: 0 0 30px rgba(255,140,0,0.2); padding-bottom: 40px; }
.podium-item.first .podium-avatar { width: 72px; height: 72px; font-size: 32px; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); }
.podium-crown { font-size: 28px; }
.podium-crown .ns-icon { font-size: 28px; color: var(--accent-primary); }
.podium-rank { font-family: 'Orbitron', monospace; font-size: 24px; font-weight: 800; color: var(--text-muted); }
.podium-item.first .podium-rank { color: var(--accent-primary); }
.podium-avatar { width: 56px; height: 56px; background: var(--bg-card-hover); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: var(--accent-primary); }
.podium-name { color: var(--text-primary); font-weight: 700; font-size: 15px; }
.podium-name:hover, .player-name:hover { color: var(--accent-primary); }
.podium-score { font-size: 20px !important; }
.lb-table { background: var(--bg-card); border: 1px solid var(--border-color); }
.rank-cell { width: 60px; }
.rank-badge { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; font-family: 'Orbitron', monospace; font-weight: 800; font-size: 14px; background: rgba(255,255,255,0.05); color: var(--text-muted); }
.rank-1 { background: rgba(255,140,0,0.2); color: var(--accent-primary); }
.rank-2 { background: rgba(192,192,192,0.15); color: #c0c0c0; }
.rank-3 { background: rgba(205,127,50,0.15); color: #cd7f32; }
.player-cell { display: flex; align-items: center; gap: 12px; }
.player-avatar { width: 36px; height: 36px; background: rgba(255,140,0,0.1); border: 1px solid rgba(255,140,0,0.2); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; color: var(--accent-primary); }
.player-name { color: var(--text-primary); font-weight: 600; }
.text-green { color: var(--accent-green); }
.text-yellow { color: #ffc107; }
.text-red { color: var(--accent-red); }
</style>
