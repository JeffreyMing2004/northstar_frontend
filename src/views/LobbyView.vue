<template>
  <div class="lobby container">
    <div class="page-header">
      <h1 class="section-title">房间大厅</h1>
      <span class="sync-notice"><NsIcon name="refresh" /> 由 Minecraft 服务器实时同步</span>
    </div>

    <div class="lobby-filters">
      <div class="filter-group">
        <select v-model="filterMode" class="ns-input filter-select">
          <option value="">全部模式</option>
          <option value="tdm">团队死斗</option>
          <option value="dom">据点争夺</option>
          <option value="br">生存竞技</option>
          <option value="ctf">夺旗战</option>
        </select>
        <select v-model="filterMap" class="ns-input filter-select">
          <option value="">全部地图</option>
          <option value="desert">沙漠要塞</option>
          <option value="end">末地城</option>
          <option value="jungle">丛林神殿</option>
          <option value="ice">冰刺平原</option>
        </select>
      </div>
      <div class="filter-search">
        <NsIcon name="search" class="filter-search-icon" />
        <input v-model="searchText" class="ns-input" placeholder="搜索房间名称..." />
      </div>
    </div>

    <div class="rooms-list">
      <div class="room-row ns-card" v-for="r in filteredRooms" :key="r.id">
        <div class="room-status">
          <span :class="['status-dot', r.status]"></span>
          <span class="status-text"><NsIcon :name="r.status === 'waiting' ? 'clock' : 'play'" /> {{ statusLabel(r.status) }}</span>
        </div>
        <div class="room-main">
          <h3 class="room-name">{{ r.name }}</h3>
          <div class="room-meta">
            <span class="ns-tag"><NsIcon name="tag" /> {{ r.mode }}</span>
            <span class="room-map-text"><NsIcon name="map" /> {{ r.map }}</span>
          </div>
        </div>
        <div class="room-host">
          <span style="font-size:12px;color:var(--text-muted)">房主</span>
          <span><NsIcon name="user" /> {{ r.host }}</span>
        </div>
        <div class="room-players-info">
          <div class="player-bar">
            <div class="player-fill" :style="{ width: (r.players/r.maxPlayers*100)+'%' }"></div>
          </div>
          <span class="player-count"><NsIcon name="team" /> {{ r.players }}/{{ r.maxPlayers }}</span>
        </div>
        <div class="room-ping">
          <span :class="r.ping < 30 ? 'text-green' : r.ping < 60 ? 'text-yellow' : 'text-red'">
            <NsIcon name="signal" /> {{ r.ping }}ms
          </span>
        </div>
        <div class="room-source"><NsIcon name="server" /> 游戏服同步</div>
      </div>
    </div>

    <div v-if="filteredRooms.length === 0" class="empty-state">
      <div class="empty-icon"><NsIcon name="home" /></div>
      <p>暂无符合条件的房间</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getRooms } from '../api/rooms'

const filterMode = ref('')
const filterMap = ref('')
const searchText = ref('')
const rooms = ref([])
const loading = ref(false)

const filteredRooms = computed(() => {
  let result = rooms.value
  if (filterMode.value) result = result.filter(r => r.modeKey === filterMode.value)
  if (filterMap.value) result = result.filter(r => r.mapKey === filterMap.value)
  if (searchText.value) result = result.filter(r => r.name.includes(searchText.value))
  return result
})

function statusLabel(s) { return s === 'waiting' ? '等待中' : '进行中'; }

async function fetchRooms() {
  loading.value = true
  try {
    const params = {}
    if (filterMode.value) params.mode = filterMode.value
    const res = await getRooms(params)
    rooms.value = res.data || []
  } catch (e) {
    console.error('Failed to load rooms:', e)
  } finally {
    loading.value = false
  }
}

watch([filterMode, filterMap], () => { fetchRooms() })
onMounted(() => { fetchRooms() })
</script>

<style scoped>
.lobby { padding: 40px 30px 80px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
.page-header .ns-icon { margin-right: 4px; }
.lobby-filters { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
.filter-group { display: flex; gap: 12px; }
.filter-select { width: 160px; }
.filter-search { flex: 1; min-width: 200px; position: relative; }
.filter-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 14px; z-index: 1; }
.filter-search .ns-input { padding-left: 38px; }
.rooms-list { display: flex; flex-direction: column; gap: 10px; }
.room-row { display: flex; align-items: center; gap: 20px; padding: 18px 24px; }
.room-status { display: flex; align-items: center; gap: 8px; min-width: 90px; }
.room-status .ns-icon { font-size: 13px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-dot.waiting { background: var(--accent-green); box-shadow: 0 0 8px rgba(76,175,80,0.5); }
.status-dot.playing { background: var(--accent-primary); box-shadow: 0 0 8px var(--accent-glow); }
.status-text { font-size: 12px; color: var(--text-secondary); font-weight: 600; display: flex; align-items: center; gap: 4px; }
.room-main { flex: 1; min-width: 200px; }
.room-name { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.room-meta { display: flex; align-items: center; gap: 10px; }
.room-meta .ns-icon { font-size: 12px; margin-right: 2px; }
.room-map-text { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.room-map-text .ns-icon { font-size: 12px; }
.room-host { display: flex; flex-direction: column; gap: 2px; font-size: 14px; font-weight: 600; min-width: 100px; }
.room-host .ns-icon { font-size: 13px; margin-right: 4px; }
.room-players-info { display: flex; align-items: center; gap: 10px; min-width: 140px; }
.player-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.06); overflow: hidden; }
.player-fill { height: 100%; background: var(--accent-primary); transition: width 0.5s; }
.player-count { font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 600; color: var(--text-secondary); min-width: 56px; display: flex; align-items: center; gap: 4px; }
.player-count .ns-icon { font-size: 13px; }
.room-ping { min-width: 80px; text-align: center; font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 600; }
.room-ping .ns-icon { font-size: 13px; margin-right: 4px; }
.sync-notice, .room-source { color: var(--text-muted); font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 5px; min-width: 100px; }
.text-green { color: var(--accent-green); }
.text-yellow { color: #ffc107; }
.text-red { color: var(--accent-red); }
.empty-state { text-align: center; padding: 80px 0; color: var(--text-muted); }
.empty-icon { margin-bottom: 16px; }
.empty-icon .ns-icon { font-size: 64px; }
</style>
