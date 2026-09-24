<template>
  <div class="settings container">
    <div class="settings-hero">
      <div class="settings-badge">ACCOUNT</div>
      <h1 class="section-title">账号设置</h1>
      <p class="settings-desc">管理你的绑定信息。QQ 与游戏 ID 是内测资格校验的凭据，必须与进游戏时填写的完全一致。</p>
    </div>

    <div v-if="!isLoggedIn" class="state-card ns-card">
      <NsIcon name="lock" />
      <p>请先登录后再管理账号设置</p>
      <router-link to="/auth/login" class="ns-btn ns-btn-filled"><NsIcon name="login" /> 去登录</router-link>
    </div>

    <div v-else-if="loading" class="state-card ns-card">
      <NsIcon name="refresh" />
      <p>正在加载账号信息…</p>
    </div>

    <div v-else-if="loadError" class="state-card ns-card">
      <NsIcon name="warning" />
      <p>{{ loadError }}</p>
      <button class="ns-btn" @click="load"><NsIcon name="refresh" /> 重试</button>
    </div>

    <div v-else class="settings-grid">
      <!-- 账号信息（只读） -->
      <section class="ns-card panel">
        <h2 class="panel-title"><NsIcon name="user" /> 账号信息</h2>
        <div class="info-list">
          <div class="info-row">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ user.username }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ user.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">平台角色</span>
            <span class="info-value">{{ roleLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">内测状态</span>
            <span :class="['ns-tag', betaTagClass]">{{ betaLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ formatDate(user.createdAt) }}</span>
          </div>
        </div>
      </section>

      <!-- QQ 绑定：只允许一次 -->
      <section class="ns-card panel">
        <h2 class="panel-title"><NsIcon name="lock" /> QQ 号</h2>

        <template v-if="qqBound">
          <div class="bound-box">
            <div class="bound-head"><NsIcon name="check-circle" /> 已绑定</div>
            <div class="bound-value">{{ user.qq }}</div>
            <div v-if="user.qqBoundAt" class="bound-time">绑定时间：{{ formatDate(user.qqBoundAt) }}</div>
          </div>
          <p class="panel-note">
            <NsIcon name="warning" />
            QQ 号一个账号只能绑定一次，绑定后无法自行更改。如填写有误，请联系管理员更正。
          </p>
        </template>

        <template v-else>
          <p class="panel-desc">
            绑定后就成为内测资格校验的凭据，进游戏时填写的 QQ 必须与此处一致。
            <strong>一个账号只能绑定一次，绑定后不可更改。</strong>
          </p>
          <input
            v-model.trim="qqInput"
            class="ns-input"
            maxlength="11"
            inputmode="numeric"
            placeholder="请输入 QQ 号"
            :disabled="savingQq"
            @keyup.enter="qqValid && (qqConfirm = true)"
          />
          <span v-if="qqInput && !qqValid" class="field-hint error">
            <NsIcon name="close-circle" /> QQ 号应为 5-11 位数字，且不能以 0 开头
          </span>

          <div v-if="qqConfirm" class="confirm-box">
            <p class="confirm-text">
              <NsIcon name="warning" /> 确认将 <strong>{{ qqInput }}</strong> 绑定为你的 QQ 号？绑定后不可更改。
            </p>
            <div class="confirm-actions">
              <button class="ns-btn" :disabled="savingQq" @click="qqConfirm = false">
                <NsIcon name="arrow-left" /> 再想想
              </button>
              <button class="ns-btn ns-btn-filled" :disabled="savingQq" @click="submitQq">
                <NsIcon name="check" /> {{ savingQq ? '绑定中...' : '确认绑定' }}
              </button>
            </div>
          </div>
          <button v-else class="ns-btn ns-btn-filled" :disabled="!qqValid" @click="qqConfirm = true">
            <NsIcon name="lock" /> 绑定 QQ
          </button>
        </template>

        <p v-if="qqError" class="form-error"><NsIcon name="warning" /> {{ qqError }}</p>
        <p v-if="qqOk" class="form-ok"><NsIcon name="check-circle" /> {{ qqOk }}</p>
      </section>

      <!-- 游戏 ID -->
      <section class="ns-card panel">
        <h2 class="panel-title"><NsIcon name="gamepad" /> Minecraft ID</h2>
        <p class="panel-desc">
          离线服游戏 ID。白名单以「QQ + 游戏ID」为键，更换后白名单会自动同步到新 ID，旧 ID 随即失效。
        </p>
        <div class="info-row current">
          <span class="info-label">当前绑定</span>
          <span class="info-value">{{ user.mcId || '未绑定' }}</span>
        </div>
        <div class="field-row">
          <input
            v-model.trim="mcIdInput"
            class="ns-input"
            maxlength="16"
            placeholder="3-16 位字母、数字或下划线"
            :disabled="savingMc"
            @keyup.enter="mcValid && submitMc()"
          />
          <button class="ns-btn ns-btn-filled" :disabled="!mcValid || savingMc" @click="submitMc">
            <NsIcon name="gamepad" /> {{ savingMc ? '提交中...' : (user.mcId ? '更换' : '绑定') }}
          </button>
        </div>
        <span v-if="mcIdInput && !mcValid" class="field-hint error">
          <NsIcon name="close-circle" /> 3-16 位，仅限字母、数字和下划线
        </span>
        <p v-if="mcError" class="form-error"><NsIcon name="warning" /> {{ mcError }}</p>
        <p v-if="mcOk" class="form-ok"><NsIcon name="check-circle" /> {{ mcOk }}</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bindGameApi, getProfile, updateProfileApi } from '../api/auth'
import { useAuth } from '../stores/auth'

const { isLoggedIn, updateProfile: syncAuth } = useAuth()

const loading = ref(true)
const loadError = ref('')
const user = ref({})

const qqInput = ref('')
const qqConfirm = ref(false)
const savingQq = ref(false)
const qqError = ref('')
const qqOk = ref('')

const mcIdInput = ref('')
const savingMc = ref(false)
const mcError = ref('')
const mcOk = ref('')

// 与后端 northstar.verify.qq-pattern 保持一致的默认规则
const qqValid = computed(() => /^[1-9]\d{4,10}$/.test(qqInput.value))
const mcValid = computed(() => /^[a-zA-Z0-9_]{3,16}$/.test(mcIdInput.value))
const qqBound = computed(() => !!user.value.qq)

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

async function submitQq() {
  qqError.value = ''
  qqOk.value = ''
  savingQq.value = true
  try {
    const res = await updateProfileApi({ qq: qqInput.value })
    applyUser(res.data)
    qqConfirm.value = false
    qqOk.value = '绑定成功。该 QQ 号将用于进游戏时的资格校验。'
  } catch (e) {
    // 后端把「已绑定不可更改」的原话放在 message 里，直接透给玩家
    qqError.value = e.response?.data?.message || '绑定失败，请稍后重试'
  } finally {
    savingQq.value = false
  }
}

async function submitMc() {
  mcError.value = ''
  mcOk.value = ''
  savingMc.value = true
  try {
    const res = await bindGameApi(mcIdInput.value)
    applyUser(res.data)
    mcOk.value = '游戏 ID 已更新，白名单已同步到新 ID。'
    mcIdInput.value = ''
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
.settings { padding: 40px 30px 80px; }
.settings-hero { text-align: center; margin-bottom: 44px; }
.settings-badge { display: inline-block; padding: 6px 20px; background: rgba(255,140,0,0.12); border: 1px solid rgba(255,140,0,0.3); color: var(--accent-primary); font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 700; letter-spacing: 4px; margin-bottom: 20px; }
.settings-hero .section-title { display: block; text-align: center; }
.settings-hero .section-title::after { left: 50%; transform: translateX(-50%); }
.settings-desc { color: var(--text-secondary); font-size: 15px; margin-top: 12px; }
.state-card { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px 32px; text-align: center; color: var(--text-secondary); }
.state-card .ns-icon { font-size: 36px; color: var(--accent-primary); }
.settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; align-items: start; }
.panel { display: flex; flex-direction: column; gap: 14px; padding: 28px; }
.panel-title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; }
.panel-title .ns-icon { font-size: 18px; color: var(--accent-primary); }
.panel-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }
.panel-desc strong { color: var(--accent-primary); }
.panel-note { display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px; background: rgba(255,193,7,0.07); border: 1px solid rgba(255,193,7,0.25); color: #ffc107; font-size: 12.5px; line-height: 1.7; }
.panel-note .ns-icon { font-size: 14px; margin-top: 2px; }
.info-list { display: flex; flex-direction: column; }
.info-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.info-row:last-child { border-bottom: none; }
.info-row.current { border-bottom: none; padding: 10px 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); }
.info-label { color: var(--text-muted); font-size: 13px; }
.info-value { font-weight: 600; font-size: 14px; word-break: break-all; text-align: right; }
.bound-box { padding: 18px; background: rgba(76,175,80,0.06); border: 1px solid rgba(76,175,80,0.3); }
.bound-head { display: flex; align-items: center; gap: 6px; color: var(--accent-green); font-size: 13px; font-weight: 700; }
.bound-head .ns-icon { font-size: 14px; }
.bound-value { font-family: 'Orbitron', monospace; font-size: 24px; font-weight: 800; letter-spacing: 2px; margin: 10px 0 6px; color: var(--text-primary); }
.bound-time { font-size: 12px; color: var(--text-muted); }
.field-row { display: flex; gap: 10px; align-items: stretch; }
.field-row .ns-input { flex: 1; }
.field-row .ns-btn { white-space: nowrap; padding: 12px 20px; }
.ns-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ns-btn:disabled:hover { background: transparent; color: var(--accent-primary); box-shadow: none; transform: none; }
.ns-btn-filled:disabled:hover { background: var(--accent-primary); color: #000; }
.field-hint { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.field-hint .ns-icon { font-size: 12px; }
.field-hint.error { color: var(--accent-red); }
.confirm-box { padding: 16px; background: rgba(255,140,0,0.06); border: 1px solid rgba(255,140,0,0.3); }
.confirm-text { font-size: 13px; color: var(--text-secondary); line-height: 1.7; display: flex; align-items: flex-start; gap: 8px; margin-bottom: 14px; }
.confirm-text .ns-icon { font-size: 15px; color: var(--accent-primary); margin-top: 2px; }
.confirm-text strong { color: var(--accent-primary); }
.confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
.confirm-actions .ns-btn { padding: 10px 20px; }
.form-error, .form-ok { display: flex; align-items: center; gap: 6px; padding: 10px 12px; font-size: 12.5px; line-height: 1.6; }
.form-error { background: rgba(244,67,54,0.08); border: 1px solid rgba(244,67,54,0.25); color: var(--accent-red); }
.form-ok { background: rgba(76,175,80,0.08); border: 1px solid rgba(76,175,80,0.25); color: var(--accent-green); }
.form-error .ns-icon, .form-ok .ns-icon { font-size: 14px; }
@media (max-width: 520px) {
  .settings { padding: 30px 16px 60px; }
  .field-row { flex-direction: column; }
}
</style>
