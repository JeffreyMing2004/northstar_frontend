<template>
  <div class="settings container">
    <div class="settings-hero">
      <div class="settings-badge">ACCOUNT</div>
      <h1 class="section-title">账号设置</h1>
      <p class="settings-desc">
        QQ 号与 Minecraft ID 是内测资格校验的凭据，必须与进游戏时填写的完全一致。
        <strong>两项都只允许绑定一次，绑定后不可更改。</strong>
      </p>
    </div>

    <div v-if="!isLoggedIn" class="state-card ns-card">
      <NsIcon name="lock" :size="36" />
      <p>请先登录后再管理账号设置</p>
      <router-link to="/auth/login" class="ns-btn ns-btn-filled"><NsIcon name="login" :size="15" /> 去登录</router-link>
    </div>

    <div v-else-if="loading" class="state-card ns-card">
      <NsIcon name="refresh" :size="36" />
      <p>正在加载账号信息…</p>
    </div>

    <div v-else-if="loadError" class="state-card ns-card">
      <NsIcon name="warning" :size="36" />
      <p>{{ loadError }}</p>
      <button class="ns-btn" @click="load"><NsIcon name="refresh" :size="15" /> 重试</button>
    </div>

    <div v-else class="settings-body">
      <!-- ① 账号概览 -->
      <section class="ns-card overview-card">
        <div class="overview-identity">
          <PlayerAvatar :player-id="user.mcId || user.username" :label="user.username" :size="56" />
          <div class="overview-text">
            <h2 class="overview-name">{{ user.username }}</h2>
            <p class="overview-mail"><NsIcon name="mail" :size="13" /> {{ user.email }}</p>
            <div class="overview-tags">
              <span class="ns-tag" :class="user.role === 'admin' ? 'ns-tag-blue' : ''">
                <NsIcon name="shield" :size="12" /> {{ roleLabel }}
              </span>
              <span class="ns-tag" :class="betaTagClass">
                <NsIcon name="key" :size="12" /> {{ betaLabel }}
              </span>
            </div>
          </div>
        </div>

        <div class="overview-stats">
          <div class="stat">
            <span class="stat-label">绑定进度</span>
            <span class="stat-value">{{ bindProgress }}<em>/2</em></span>
            <span class="stat-hint">QQ + Minecraft ID</span>
          </div>
          <div class="stat">
            <span class="stat-label">客户端白名单</span>
            <span class="stat-value" :class="whitelistClass">{{ whitelistLabel }}</span>
            <span class="stat-hint">决定能否进入游戏</span>
          </div>
          <div class="stat">
            <span class="stat-label">注册时间</span>
            <span class="stat-value small">{{ formatDate(user.createdAt) }}</span>
            <span class="stat-hint">账号创建于</span>
          </div>
        </div>
      </section>

      <!-- ② 内测资格与白名单 -->
      <section class="ns-card qualify-card">
        <header class="qualify-head">
          <h2 class="card-title"><NsIcon name="key" :size="18" /> 内测资格与客户端白名单</h2>
          <span class="ns-tag" :class="whitelistClass">{{ whitelistLabel }}</span>
        </header>

        <div class="qualify-rows">
          <div class="qualify-row">
            <span class="qualify-label">内测资格</span>
            <span class="qualify-value">{{ betaLabel }}</span>
          </div>
          <div class="qualify-row">
            <span class="qualify-label">客户端白名单</span>
            <span class="qualify-value">{{ whitelistLabel }}</span>
          </div>
          <div v-if="user.whitelistExpireAt" class="qualify-row">
            <span class="qualify-label">白名单到期时间</span>
            <span class="qualify-value">{{ formatDate(user.whitelistExpireAt) }}</span>
          </div>
        </div>

        <p v-if="whitelistWarning" class="qualify-note warn">
          <NsIcon name="warning" :size="13" /> {{ whitelistWarning }}
        </p>
        <p v-else class="qualify-note">
          <NsIcon name="shield-check" :size="13" />
          通过内测审批后会<strong>自动加入白名单</strong>，无需手工申请。若管理员取消你的内测资格，
          白名单授权会同时移除；管理员手工补录的白名单不受影响。
        </p>
      </section>

      <!-- ③ 两项绑定：均只允许绑定一次 -->
      <div class="bind-section-head">
        <h2 class="card-title"><NsIcon name="lock" :size="18" /> 绑定信息</h2>
        <span class="bind-section-hint">两项各只能绑定一次，绑定后需联系管理员才能更正</span>
      </div>

      <div class="bind-grid">
        <BindingCard
          v-model="qqInput"
          icon="lock"
          title="QQ 号"
          field-label="QQ 号"
          :desc="qqBound ? '进游戏时填写的 QQ 必须与此处一致，否则会被判为未获得内测资格。' : '绑定后即成为内测资格校验的凭据，进游戏时填写的 QQ 必须与此处一致。'"
          placeholder="请输入 QQ 号"
          :maxlength="11"
          :valid="qqValid"
          invalid-hint="QQ 号应为 5-11 位数字，且不能以 0 开头"
          :bound="qqBound"
          :value="user.qq"
          :bound-at="user.qqBoundAt"
          locked-note="QQ 号一个账号只能绑定一次，绑定后无法自行更改。如填写有误，请联系管理员更正。"
          :saving="savingQq"
          :error="qqError"
          :ok="qqOk"
          @submit="submitQq"
        />

        <BindingCard
          v-model="mcIdInput"
          icon="gamepad"
          title="Minecraft ID"
          field-label="离线服游戏 ID"
          :desc="mcBound ? '离线服登录使用的 ID。白名单以「QQ + 游戏ID」为键，换 ID 会导致校验不通过。' : '离线服登录使用的 ID，3-16 位字母、数字或下划线。绑定后可解锁专属战绩追踪。'"
          placeholder="3-16 位字母、数字或下划线"
          :maxlength="16"
          :valid="mcValid"
          invalid-hint="3-16 位，仅限字母、数字和下划线"
          :bound="mcBound"
          :value="user.mcId"
          :bound-at="user.mcIdBoundAt"
          locked-note="Minecraft ID 注册后不可自行更改。如填写有误，请联系管理员更正。"
          :saving="savingMc"
          :error="mcError"
          :ok="mcOk"
          @submit="submitMc"
        />
      </div>

      <!-- ④ 账号信息明细 -->
      <section class="ns-card detail-card">
        <h2 class="card-title"><NsIcon name="user" :size="18" /> 账号信息</h2>
        <div class="detail-list">
          <div class="detail-row">
            <span class="detail-label">用户名</span>
            <span class="detail-value">{{ user.username }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">邮箱</span>
            <span class="detail-value">{{ user.email }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">平台角色</span>
            <span class="detail-value">{{ roleLabel }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">段位 / 评分</span>
            <span class="detail-value">{{ user.rank || '—' }} · {{ user.score ?? '—' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">QQ 绑定时间</span>
            <span class="detail-value">{{ formatDate(user.qqBoundAt) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Minecraft ID 绑定时间</span>
            <span class="detail-value">{{ formatDate(user.mcIdBoundAt) }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bindGameApi, getProfile, updateProfileApi } from '../api/auth'
import { useAuth } from '../stores/auth'
import BindingCard from '../components/BindingCard.vue'
import NsIcon from '../components/NsIcon.vue'
import PlayerAvatar from '../components/PlayerAvatar.vue'

const { isLoggedIn, updateProfile: syncAuth } = useAuth()

const loading = ref(true)
const loadError = ref('')
const user = ref({})

const qqInput = ref('')
const savingQq = ref(false)
const qqError = ref('')
const qqOk = ref('')

const mcIdInput = ref('')
const savingMc = ref(false)
const mcError = ref('')
const mcOk = ref('')

// 与后端 northstar.verify.qq-pattern / McIdFormat 保持一致的默认规则
const qqValid = computed(() => /^[1-9]\d{4,10}$/.test(qqInput.value))
const mcValid = computed(() => /^[a-zA-Z0-9_]{3,16}$/.test(mcIdInput.value))

const qqBound = computed(() => !!user.value.qq)
const mcBound = computed(() => !!user.value.mcId)
const bindProgress = computed(() => (qqBound.value ? 1 : 0) + (mcBound.value ? 1 : 0))

const roleLabel = computed(() => (user.value.role === 'admin' ? '管理员' : '普通玩家'))
const betaLabel = computed(() => ({
  none: '未申请',
  pending: '审核中',
  approved: '已通过',
  denied: '未通过'
}[user.value.betaStatus] || '未申请'))
const betaTagClass = computed(() => ({
  approved: 'ns-tag-green',
  pending: 'ns-tag-blue',
  denied: 'ns-tag-red'
}[user.value.betaStatus] || ''))

// 白名单状态由后端按条目实时计算（active / disabled / expired / missing）
const whitelistLabel = computed(() => ({
  active: '已生效',
  disabled: '已停用',
  expired: '已过期',
  missing: '未同步'
}[user.value.whitelistStatus] || '未同步'))
const whitelistClass = computed(() => ({
  active: 'ns-tag-green',
  disabled: 'ns-tag-red',
  expired: 'ns-tag-amber',
  missing: 'ns-tag-muted'
}[user.value.whitelistStatus] || 'ns-tag-muted'))

const whitelistWarning = computed(() => {
  if (user.value.betaStatus === 'approved' && user.value.whitelistStatus !== 'active') {
    return '内测资格已通过，但白名单授权当前未生效。请确认绑定信息无误，或联系管理员核对。'
  }
  return ''
})

function formatDate(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : '—'
}

function applyUser(data) {
  user.value = data || {}
  // 顶栏头像等处读的是本地缓存里的用户对象，改完绑定要一起同步
  if (isLoggedIn.value && data) syncAuth(data)
}

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await getProfile()
    applyUser(res.data)
  } catch (e) {
    loadError.value = e.response?.data?.message || '账号信息加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function submitQq(payload) {
  qqError.value = ''
  qqOk.value = ''
  savingQq.value = true
  try {
    const res = await updateProfileApi({ qq: payload })
    applyUser(res.data)
    qqOk.value = '绑定成功。该 QQ 号将用于进游戏时的资格校验。'
  } catch (e) {
    // 后端把「已绑定不可更改」的原话放在 message 里，直接透给玩家
    qqError.value = e.response?.data?.message || '绑定失败，请稍后重试'
  } finally {
    savingQq.value = false
  }
}

async function submitMc(payload) {
  mcError.value = ''
  mcOk.value = ''
  savingMc.value = true
  try {
    const res = await bindGameApi(payload)
    applyUser(res.data)
    mcOk.value = 'Minecraft ID 绑定成功，白名单已按新 ID 同步。'
  } catch (e) {
    mcError.value = e.response?.data?.message || '绑定失败，请稍后重试'
  } finally {
    savingMc.value = false
  }
}

onMounted(() => {
  if (!isLoggedIn.value) {
    loading.value = false
    return
  }
  load()
})
</script>

<style scoped>
.settings { padding: 40px 30px 80px; max-width: 1060px; margin: 0 auto; }
.settings-hero { text-align: center; margin-bottom: 40px; }
.settings-badge { display: inline-block; padding: 6px 20px; background: rgba(255,140,0,0.12); border: 1px solid rgba(255,140,0,0.3); color: var(--accent-primary); font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 700; letter-spacing: 4px; margin-bottom: 20px; }
.settings-hero .section-title { display: block; text-align: center; }
.settings-hero .section-title::after { left: 50%; transform: translateX(-50%); }
.settings-desc { color: var(--text-secondary); font-size: 15px; line-height: 1.8; margin-top: 12px; max-width: 640px; margin-left: auto; margin-right: auto; }
.settings-desc strong { color: var(--accent-primary); }

.state-card { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px 32px; text-align: center; color: var(--text-secondary); }
.state-card .ns-icon { color: var(--accent-primary); }

.settings-body { display: flex; flex-direction: column; gap: 20px; }

.card-title { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; }
.card-title .ns-icon { color: var(--accent-primary); }

/* ① 概览 */
.overview-card { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 26px; padding: 26px 28px; }
.overview-identity { display: flex; align-items: center; gap: 18px; min-width: 0; }
.overview-text { min-width: 0; }
.overview-name { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
.overview-mail { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); word-break: break-all; }
.overview-mail .ns-icon { color: var(--text-muted); }
.overview-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.overview-tags .ns-tag { display: inline-flex; align-items: center; gap: 5px; }

.overview-stats { display: flex; flex-wrap: wrap; gap: 12px; }
.stat { display: flex; flex-direction: column; gap: 3px; min-width: 118px; padding: 12px 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); }
.stat-label { font-size: 11.5px; color: var(--text-muted); letter-spacing: 0.5px; }
.stat-value { font-family: 'Orbitron', monospace; font-size: 19px; font-weight: 800; }
.stat-value.small { font-family: inherit; font-size: 14px; font-weight: 700; }
.stat-value em { font-size: 12px; font-style: normal; color: var(--text-muted); }
.stat-hint { font-size: 11px; color: var(--text-muted); }
.stat-value.ns-tag-green { color: var(--accent-green); }
.stat-value.ns-tag-red { color: var(--accent-red); }
.stat-value.ns-tag-amber { color: #ffc107; }
.stat-value.ns-tag-muted { color: var(--text-muted); }

/* ② 资格与白名单 */
.qualify-card { display: flex; flex-direction: column; gap: 16px; padding: 26px 28px; }
.qualify-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.qualify-rows { display: flex; flex-direction: column; }
.qualify-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.qualify-row:last-child { border-bottom: none; }
.qualify-label { font-size: 13px; color: var(--text-muted); }
.qualify-value { font-size: 14px; font-weight: 600; text-align: right; word-break: break-all; }
.qualify-value.mono { font-family: 'Orbitron', monospace; letter-spacing: 0.5px; }
.qualify-note { display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); font-size: 12.5px; line-height: 1.75; color: var(--text-secondary); }
.qualify-note .ns-icon { margin-top: 2px; color: var(--accent-primary); }
.qualify-note strong { color: var(--accent-primary); }
.qualify-note.warn { background: rgba(255,193,7,0.07); border-color: rgba(255,193,7,0.25); color: #ffc107; }
.qualify-note.warn .ns-icon { color: #ffc107; }

/* ③ 绑定 */
.bind-section-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 10px; margin-top: 6px; }
.bind-section-hint { font-size: 12.5px; color: var(--text-muted); }
.bind-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 20px; align-items: start; }

/* ④ 明细 */
.detail-card { display: flex; flex-direction: column; gap: 14px; padding: 26px 28px; }
.detail-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0 32px; }
.detail-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.detail-label { font-size: 13px; color: var(--text-muted); white-space: nowrap; }
.detail-value { font-size: 14px; font-weight: 600; text-align: right; word-break: break-all; }

.ns-btn:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 640px) {
  .settings { padding: 30px 16px 60px; }
  .overview-card { flex-direction: column; align-items: stretch; }
  .overview-stats { justify-content: space-between; }
  .stat { flex: 1 1 30%; min-width: 0; }
}
</style>
