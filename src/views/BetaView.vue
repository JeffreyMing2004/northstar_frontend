<template>
  <div class="beta container">
    <div class="beta-hero">
      <div class="beta-badge">BETA ACCESS</div>
      <h1 class="section-title">内测资格查询</h1>
      <p class="beta-desc">输入你的账号ID或邮箱，查询是否获得NorthStar内测资格</p>
    </div>

    <div class="beta-search">
      <div class="search-card ns-card">
        <div class="search-icon"><NsIcon name="key" /></div>
        <h3 class="search-title">资格验证</h3>
        <div class="search-form">
          <input v-model="queryId" class="ns-input beta-input"
            placeholder="输入账号ID 或 邮箱地址..." @keyup.enter="doCheckBeta" />
          <button class="ns-btn ns-btn-filled beta-btn" @click="doCheckBeta" :disabled="loading">
            <NsIcon name="search" /> {{ loading ? '查询中...' : '查询资格' }}
          </button>
        </div>
        <p class="search-hint">支持 Minecraft ID、平台UID、注册邮箱</p>
      </div>
    </div>

    <div v-if="result === 'approved'" class="result-section animate-in">
      <div class="result-card ns-card result-approved">
        <div class="result-status">
          <span class="status-icon"><NsIcon name="check-circle" /></span>
          <h2 class="status-title">恭喜！你已获得内测资格</h2>
        </div>
        <div class="result-details">
          <div class="detail-row">
            <span class="detail-label"><NsIcon name="user" /> 账号</span>
            <span class="detail-value">{{ queryId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><NsIcon name="shield" /> 资格类型</span>
            <span class="detail-value ns-tag-green ns-tag">{{ betaInfo.type }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><NsIcon name="clock" /> 获得时间</span>
            <span class="detail-value">{{ betaInfo.date }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><NsIcon name="calendar" /> 有效期至</span>
            <span class="detail-value">{{ betaInfo.expire }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label"><NsIcon name="gamepad" /> 可体验模式</span>
            <span class="detail-value">{{ betaInfo.modes }}</span>
          </div>
        </div>
        <div class="result-actions">
          <router-link to="/lobby" class="ns-btn ns-btn-filled"><NsIcon name="login" /> 进入游戏大厅</router-link>
          <router-link to="/docs" class="ns-btn"><NsIcon name="file" /> 查看使用指南</router-link>
        </div>
      </div>
    </div>

    <div v-if="result === 'denied'" class="result-section animate-in">
      <div class="result-card ns-card result-denied">
        <div class="result-status">
          <span class="status-icon"><NsIcon name="close-circle" /></span>
          <h2 class="status-title">暂未获得内测资格</h2>
        </div>
        <p class="denied-msg">你的账号 <strong>{{ queryId }}</strong> 当前不在内测名单中</p>
        <div class="apply-section">
          <h3 class="apply-title">申请内测资格</h3>
          <div class="apply-form">
            <select v-model="selectedPlanId" class="ns-input" :disabled="!openPlans.length">
              <option value="" disabled>{{ openPlans.length ? '选择内测计划' : '当前暂无可申请计划' }}</option>
              <option v-for="plan in openPlans" :key="plan.id" :value="plan.id">
                {{ plan.phase }} · {{ plan.name }}（剩余 {{ plan.capacity - plan.approvedCount }} 名）
              </option>
            </select>
            <input v-model="applyEmail" class="ns-input" placeholder="输入你的邮箱地址..." />
            <select v-model="applyReason" class="ns-input">
              <option value="" disabled>选择申请理由</option>
              <option value="veteran">资深MC玩家 (3年以上)</option>
              <option value="competitive">竞技/赛事经验</option>
              <option value="content">内容创作者</option>
              <option value="tester">测试经验丰富</option>
              <option value="other">其他</option>
            </select>
            <button class="ns-btn ns-btn-filled" @click="submitApply" :disabled="!selectedPlanId || !openPlans.length">
              <NsIcon name="send" /> 提交申请
            </button>
          </div>
          <p class="apply-hint">{{ openPlans.length ? '审核周期约 3-5 个工作日，结果将通过邮件通知' : '计划开放后即可在此提交申请' }}</p>
        </div>
      </div>
    </div>

    <div v-if="result === 'notfound'" class="result-section animate-in">
      <div class="result-card ns-card result-notfound">
        <div class="result-status">
          <span class="status-icon"><NsIcon name="question" /></span>
          <h2 class="status-title">未找到该账号</h2>
        </div>
        <p class="notfound-msg">请检查输入的账号ID或邮箱是否正确，或先注册 NorthStar 平台账号</p>
        <div class="result-actions">
          <button class="ns-btn" @click="result = null"><NsIcon name="refresh" /> 重新查询</button>
          <a href="#" class="ns-btn ns-btn-filled"><NsIcon name="user-plus" /> 注册账号</a>
        </div>
      </div>
    </div>

    <div class="beta-info-section">
      <h2 class="section-title">内测内容</h2>
      <div class="info-grid">
        <div class="info-card ns-card" v-for="feature in betaFeatures" :key="feature.title">
          <div class="info-icon"><NsIcon :name="feature.icon" /></div>
          <h3 class="info-title">{{ feature.title }}</h3>
          <p class="info-desc">{{ feature.desc }}</p>
        </div>
      </div>
    </div>

    <div class="timeline-section">
      <h2 class="section-title">内测计划</h2>
      <div v-if="plansLoading" class="plan-state">正在加载内测计划</div>
      <div v-else-if="!timeline.length" class="plan-state">暂无已发布的内测计划</div>
      <div v-else class="timeline">
        <div
          v-for="t in timeline"
          :key="t.id"
          :class="['timeline-item', { active: t.active, done: t.done }]"
        >
          <div class="timeline-dot"></div>
          <div class="timeline-content ns-card">
            <div class="timeline-header">
              <span class="timeline-phase">{{ t.phase }}</span>
              <span class="timeline-date"><NsIcon name="calendar" /> {{ t.date }}</span>
            </div>
            <h4 class="timeline-title">{{ t.title }}</h4>
            <p class="timeline-desc">{{ t.desc }}</p>
            <div class="timeline-meta">
              <span><NsIcon name="team" /> {{ t.approvedCount }} / {{ t.capacity }}</span>
              <span><NsIcon name="gamepad" /> {{ t.modes || '全部模式' }}</span>
              <span :class="['plan-status', t.status]">{{ t.statusLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkBeta, applyBeta, getBetaPlans } from '../api/beta'
import { useAuth } from '../stores/auth'

const router = useRouter()
const { isLoggedIn } = useAuth()

const queryId = ref('')
const result = ref(null)
const loading = ref(false)
const betaInfo = ref({})
const applyEmail = ref('')
const applyReason = ref('')
const plans = ref([])
const plansLoading = ref(true)
const selectedPlanId = ref('')

const today = new Date().toISOString().slice(0, 10)
const openPlans = computed(() => plans.value.filter(plan =>
  plan.status === 'active'
  && (!plan.startsOn || plan.startsOn <= today)
  && (!plan.endsOn || plan.endsOn >= today)
  && Number(plan.approvedCount) < Number(plan.capacity)
))

const timeline = computed(() => plans.value.map(plan => ({
  ...plan,
  date: plan.startsOn || plan.endsOn
    ? `${plan.startsOn || '待定'} 至 ${plan.endsOn || '长期'}`
    : '日期待定',
  title: plan.name,
  desc: plan.description || '暂无计划说明',
  statusLabel: planStatusLabel(plan.status),
  active: plan.status === 'active',
  done: plan.status === 'completed' || (plan.endsOn && plan.endsOn < today)
})))

async function doCheckBeta() {
  if (!queryId.value.trim()) return
  loading.value = true
  result.value = null
  try {
    const res = await checkBeta(queryId.value.trim())
    const data = res.data
    if (data.betaStatus === 'approved') {
      result.value = 'approved'
      betaInfo.value = {
        type: data.type || '标准内测资格',
        date: data.date || '2026-08-15',
        expire: data.expire || '2026-12-31',
        modes: data.modes || '全部竞技模式'
      }
    } else if (data.betaStatus === 'denied') {
      result.value = 'denied'
    } else {
      result.value = 'denied'
    }
  } catch (e) {
    result.value = 'notfound'
  } finally {
    loading.value = false
  }
}

async function loadPlans() {
  plansLoading.value = true
  try {
    const res = await getBetaPlans()
    plans.value = res.data || []
    selectedPlanId.value = openPlans.value[0]?.id || ''
  } catch (e) {
    plans.value = []
  } finally {
    plansLoading.value = false
  }
}

async function submitApply() {
  if (!selectedPlanId.value || !applyEmail.value || !applyReason.value) return
  if (!isLoggedIn.value) {
    router.push('/auth/login')
    return
  }
  try {
    await applyBeta({
      query: queryId.value,
      email: applyEmail.value,
      reason: applyReason.value,
      planId: Number(selectedPlanId.value)
    })
    alert('申请已提交！我们会通过邮件通知你结果。')
    applyEmail.value = ''
    applyReason.value = ''
    selectedPlanId.value = openPlans.value[0]?.id || ''
  } catch (e) {
    alert(e.response?.data?.message || '申请提交失败')
  }
}

const betaFeatures = ref([
  { icon: 'sword', title: '竞技匹配', desc: '体验智能ELO匹配系统，与实力相近的对手进行激烈的MC PvP对战。' },
  { icon: 'chart', title: '数据追踪', desc: '详细记录每场对战数据，包括击杀、死亡、K/D比、胜率等核心指标。' },
  { icon: 'trophy', title: '排行榜', desc: '参与全服排名竞争，证明你是NorthStar平台最强的MC战士。' }
])

function planStatusLabel(status) {
  return { active: '开放中', paused: '已暂停', completed: '已完成', draft: '草稿' }[status] || status
}

onMounted(loadPlans)
</script>

<style scoped>
.beta { padding: 40px 30px 80px; }
.beta-hero { text-align: center; margin-bottom: 48px; }
.beta-badge { display: inline-block; padding: 6px 20px; background: rgba(255,140,0,0.12); border: 1px solid rgba(255,140,0,0.3); color: var(--accent-primary); font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 700; letter-spacing: 4px; margin-bottom: 20px; }
.beta-hero .section-title { display: block; text-align: center; }
.beta-hero .section-title::after { left: 50%; transform: translateX(-50%); }
.beta-desc { color: var(--text-secondary); font-size: 16px; margin-top: 12px; }
.beta-search { max-width: 600px; margin: 0 auto 48px; }
.search-card { text-align: center; padding: 40px 32px; }
.search-icon { margin-bottom: 16px; }
.search-icon .ns-icon { font-size: 48px; color: var(--accent-primary); }
.search-title { font-size: 20px; font-weight: 700; margin-bottom: 24px; }
.search-form { display: flex; gap: 12px; margin-bottom: 12px; }
.beta-input { flex: 1; }
.beta-btn { white-space: nowrap; }
.beta-btn .ns-icon { margin-right: 4px; }
.search-hint { font-size: 13px; color: var(--text-muted); }
.result-section { max-width: 700px; margin: 0 auto 48px; }
.result-card { padding: 36px; }
.result-approved { border-color: rgba(76,175,80,0.3); }
.result-approved::before { background: var(--accent-green); }
.result-denied { border-color: rgba(244,67,54,0.2); }
.result-notfound { border-color: rgba(255,193,7,0.2); }
.result-status { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.status-icon .ns-icon { font-size: 36px; }
.result-approved .status-icon .ns-icon { color: var(--accent-green); }
.result-denied .status-icon .ns-icon { color: var(--accent-red); }
.result-notfound .status-icon .ns-icon { color: #ffc107; }
.status-title { font-size: 22px; font-weight: 700; }
.result-details { display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); }
.detail-row { display: flex; justify-content: space-between; align-items: center; }
.detail-label { color: var(--text-muted); font-size: 14px; display: flex; align-items: center; gap: 8px; }
.detail-label .ns-icon { font-size: 14px; }
.detail-value { font-weight: 600; font-size: 14px; }
.result-actions { display: flex; gap: 16px; }
.result-actions .ns-icon { margin-right: 4px; }
.denied-msg { color: var(--text-secondary); margin-bottom: 28px; font-size: 15px; }
.denied-msg strong { color: var(--accent-primary); }
.apply-section { padding-top: 24px; border-top: 1px solid var(--border-color); }
.apply-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.apply-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
.apply-hint { font-size: 13px; color: var(--text-muted); }
.notfound-msg { color: var(--text-secondary); margin-bottom: 24px; font-size: 15px; }
.beta-info-section { margin-bottom: 64px; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
.info-card { padding: 28px; }
.info-icon { margin-bottom: 16px; }
.info-icon .ns-icon { font-size: 36px; color: var(--accent-primary); }
.info-title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
.info-desc { color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
.timeline-section { margin-bottom: 40px; }
.timeline { position: relative; padding-left: 32px; }
.timeline::before { content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 2px; background: var(--border-color); }
.timeline-item { position: relative; margin-bottom: 24px; }
.timeline-dot { position: absolute; left: -32px; top: 24px; width: 22px; height: 22px; background: var(--bg-card); border: 2px solid var(--border-color); z-index: 1; }
.timeline-item.done .timeline-dot { background: var(--accent-green); border-color: var(--accent-green); box-shadow: 0 0 10px rgba(76,175,80,0.4); }
.timeline-item.active .timeline-dot { background: var(--accent-primary); border-color: var(--accent-primary); box-shadow: 0 0 10px var(--accent-glow); animation: pulse-glow 2s infinite; }
.timeline-content { padding: 20px 24px; }
.timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.timeline-phase { font-family: 'Orbitron', monospace; font-weight: 800; font-size: 14px; color: var(--accent-primary); }
.timeline-date { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.timeline-date .ns-icon { font-size: 12px; }
.timeline-title { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
.timeline-desc { font-size: 14px; color: var(--text-secondary); }
.timeline-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; border-top: 1px solid var(--border-color); margin-top: 14px; padding-top: 14px; }
.timeline-meta > span { display: inline-flex; align-items: center; gap: 5px; color: var(--text-muted); font-size: 12px; }
.timeline-meta .ns-icon { font-size: 13px; }
.timeline-meta .plan-status { margin-left: auto; min-height: 24px; padding: 3px 8px; border: 1px solid var(--border-color); color: var(--text-muted); }
.timeline-meta .plan-status.active { border-color: rgba(255,140,0,0.4); color: var(--accent-primary); }
.timeline-meta .plan-status.paused { border-color: rgba(255,193,7,0.4); color: #ffc107; }
.timeline-meta .plan-status.completed { border-color: rgba(76,175,80,0.4); color: var(--accent-green); }
.plan-state { min-height: 140px; display: flex; align-items: center; justify-content: center; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); color: var(--text-muted); }
@media (max-width: 620px) {
  .timeline-meta .plan-status { margin-left: 0; }
}
</style>
