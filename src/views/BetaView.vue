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
        <div class="denied-actions">
          <button v-if="openPlans.length" class="ns-btn ns-btn-filled" @click="scrollToApply">
            <NsIcon name="send" /> 去申请内测资格
          </button>
          <p v-else class="apply-hint">当前没有开放中的内测计划，开放后即可申请</p>
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
          <router-link to="/auth/register" class="ns-btn ns-btn-filled"><NsIcon name="user-plus" /> 注册账号</router-link>
        </div>
      </div>
    </div>

    <!-- 申请内测：只有存在「开放中」的计划才可申请，且必须登录平台账号 -->
    <section id="beta-apply" class="apply-block">
      <h2 class="section-title">申请内测</h2>
      <p class="apply-lead">
        内测名额与平台账号绑定：申请记录、QQ、Minecraft ID 都挂在账号上，审批通过后白名单也按这个账号下发。
      </p>

      <div v-if="plansLoading" class="plan-state">正在加载内测计划</div>

      <!-- ① 没有开放中的计划：不提供申请入口 -->
      <div v-else-if="applyGate === 'no-plan'" class="apply-card ns-card">
        <div class="apply-icon"><NsIcon name="clock" /></div>
        <h3 class="apply-heading">当前没有开放中的内测计划</h3>
        <p class="apply-text">名额放出的第一时间会出现在下方「内测计划」里，届时登录平台账号即可提交申请。</p>
      </div>

      <!-- ② 未登录：申请的唯一前置条件是登录，先给登录/注册两条路 -->
      <div v-else-if="applyGate === 'logged-out'" class="apply-card ns-card">
        <div class="apply-icon"><NsIcon name="lock" /></div>
        <h3 class="apply-heading">申请内测需要登录平台账号</h3>
        <p class="apply-text">
          现有 <strong>{{ openPlans.length }}</strong> 个计划开放中，登录后即可提交申请。
        </p>
        <ul class="apply-points">
          <li><NsIcon name="arrow-right" :size="13" /><span>申请身份由登录账号决定，不接受代填别人的 QQ 或游戏 ID</span></li>
          <li><NsIcon name="arrow-right" :size="13" /><span>还没有账号？注册需绑定 QQ，Minecraft ID 注册后不可更改</span></li>
        </ul>
        <div class="apply-actions">
          <button class="ns-btn ns-btn-filled" @click="goLogin"><NsIcon name="login" /> 登录后申请</button>
          <button class="ns-btn" @click="goRegister"><NsIcon name="user-plus" /> 注册账号</button>
        </div>
      </div>

      <!-- ③ 已有资格 -->
      <div v-else-if="applyGate === 'approved'" class="apply-card ns-card apply-approved">
        <div class="apply-icon ok"><NsIcon name="check-circle" /></div>
        <h3 class="apply-heading">你已拥有内测资格</h3>
        <p class="apply-text">无需再次申请，直接用下面的账号进游戏即可。若客户端仍判断未通过，请到账号设置查看白名单状态。</p>
        <div class="apply-actions">
          <router-link to="/settings" class="ns-btn ns-btn-filled"><NsIcon name="settings" /> 查看账号设置</router-link>
          <router-link to="/docs" class="ns-btn"><NsIcon name="file" /> 查看使用指南</router-link>
        </div>
      </div>

      <!-- ④ 审核中 -->
      <div v-else-if="applyGate === 'pending'" class="apply-card ns-card apply-pending">
        <div class="apply-icon"><NsIcon name="clock" /></div>
        <h3 class="apply-heading">申请已提交，正在审核</h3>
        <div class="apply-receipt">
          <div class="receipt-row"><span class="receipt-label">申请计划</span><span class="receipt-value">{{ myApplication.planName || '—' }}</span></div>
          <div class="receipt-row"><span class="receipt-label">申请时间</span><span class="receipt-value">{{ myApplication.createdAt || '—' }}</span></div>
          <div class="receipt-row"><span class="receipt-label">通知邮箱</span><span class="receipt-value">{{ myApplication.email || '—' }}</span></div>
        </div>
        <p class="apply-text">审核周期约 3-5 个工作日，结果会通过邮件通知，期间不能重复提交。</p>
      </div>

      <!-- ⑤ 可申请 -->
      <div v-else class="apply-card ns-card">
        <h3 class="apply-heading apply-heading-left">填写申请</h3>

        <div class="apply-identity">
          <div class="identity-row">
            <span class="identity-label"><NsIcon name="user" /> 申请账号</span>
            <span class="identity-value">{{ currentUser?.username }}</span>
          </div>
          <div class="identity-row">
            <span class="identity-label"><NsIcon name="shield" /> QQ 号</span>
            <span class="identity-value" :class="{ missing: !currentUser?.qq }">{{ currentUser?.qq || '未绑定' }}</span>
          </div>
          <div class="identity-row">
            <span class="identity-label"><NsIcon name="gamepad" /> Minecraft ID</span>
            <span class="identity-value" :class="{ missing: !currentUser?.mcId }">{{ currentUser?.mcId || '未绑定' }}</span>
          </div>
        </div>
        <p class="apply-note">以上信息取自你的平台账号，客户端进服就是用它们判定的，申请时不能另填。</p>

        <div v-if="identityGap" class="apply-warn">
          <NsIcon name="warning" :size="14" />
          <span>
            账号还缺{{ identityGap }}，审批通过后无法自动下发客户端白名单，请先到
            <router-link to="/settings">账号设置</router-link> 补齐再申请。
          </span>
        </div>
        <div v-else-if="lastApplicationDenied" class="apply-warn info">
          <NsIcon name="question" :size="14" />
          <span>你上一次申请没有通过，可以换一个计划重新提交。</span>
        </div>

        <div class="apply-form">
          <select v-model="selectedPlanId" class="ns-input" :disabled="!openPlans.length">
            <option value="" disabled>选择内测计划</option>
            <option v-for="plan in openPlans" :key="plan.id" :value="plan.id">
              {{ plan.phase }} · {{ plan.name }}（剩余 {{ plan.capacity - plan.approvedCount }} 名）
            </option>
          </select>
          <input v-model.trim="applyEmail" class="ns-input" placeholder="接收审核结果的邮箱" />
          <select v-model="applyReason" class="ns-input">
            <option value="" disabled>选择申请理由</option>
            <option v-for="opt in reasonOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <button class="ns-btn ns-btn-filled" @click="submitApply" :disabled="applying || !selectedPlanId || !applyReason">
            <NsIcon name="send" /> {{ applying ? '提交中...' : '提交申请' }}
          </button>
        </div>
        <p class="apply-hint">审核周期约 3-5 个工作日，结果将通过邮件通知</p>
      </div>
    </section>

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

    <ConfirmDialog
      :open="noticeState.open"
      :title="noticeState.title"
      :message="noticeState.message"
      :details="noticeState.details"
      :tone="noticeState.tone"
      :confirm-text="noticeState.confirmText"
      :confirm-icon="noticeState.confirmIcon"
      :show-cancel="false"
      kicker="BETA ACCESS"
      @confirm="dismissNotice"
      @cancel="dismissNotice"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkBeta, applyBeta, getBetaPlans, getMyBetaApplication } from '../api/beta'
import { useAuth } from '../stores/auth'
import ConfirmDialog from '../components/ConfirmDialog.vue'

const router = useRouter()
const { isLoggedIn, currentUser } = useAuth()

const queryId = ref('')
const result = ref(null)
const loading = ref(false)
const betaInfo = ref({})
const applyEmail = ref('')
const applyReason = ref('')
const plans = ref([])
const plansLoading = ref(true)
const selectedPlanId = ref('')
/** 当前登录账号的申请状态；未登录或接口失败时为 null。 */
const myApplication = ref(null)
const applying = ref(false)

const reasonOptions = [
  { value: 'veteran', label: '资深MC玩家 (3年以上)' },
  { value: 'competitive', label: '竞技/赛事经验' },
  { value: 'content', label: '内容创作者' },
  { value: 'tester', label: '测试经验丰富' },
  { value: 'other', label: '其他' }
]

/** 站内提示弹窗（取代 window.alert）：成功/失败都走同一套面板样式。 */
const noticeState = ref({
  open: false,
  title: '',
  message: '',
  details: [],
  tone: 'default',
  confirmText: '知道了',
  confirmIcon: 'check'
})

function showNotice({ title, message, details = [], tone = 'default', confirmText = '知道了', confirmIcon = 'check' }) {
  noticeState.value = { open: true, title, message, details, tone, confirmText, confirmIcon }
}

const dismissNotice = () => {
  noticeState.value = { ...noticeState.value, open: false }
}

const today = new Date().toISOString().slice(0, 10)
const openPlans = computed(() => plans.value.filter(plan =>
  plan.status === 'active'
  && (!plan.startsOn || plan.startsOn <= today)
  && (!plan.endsOn || plan.endsOn >= today)
  && Number(plan.approvedCount) < Number(plan.capacity)
))

/**
 * 申请区的五种状态，决定这一块显示什么。
 *
 * 顺序有讲究：先看有没有可申请的计划，再看有没有登录 —— 没有开放计划时，
 * 让一个未登录的人去登录也申请不到东西，先告诉他「暂时没有名额」更诚实。
 * 资格状态优先取 myApplication（接口返回值最新），登录时缓存可能已经过期。
 */
const applyGate = computed(() => {
  if (!openPlans.value.length) return 'no-plan'
  if (!isLoggedIn.value) return 'logged-out'

  const betaStatus = myApplication.value?.betaStatus || currentUser.value?.betaStatus
  if (betaStatus === 'approved' || myApplication.value?.status === 'approved') return 'approved'
  if (myApplication.value?.hasApplication && myApplication.value.status === 'pending') return 'pending'
  return 'ready'
})

/** 账号缺少哪项进服校验凭据；缺了照样能申请，但资格发下来也进不去游戏。 */
const identityGap = computed(() => {
  const gaps = []
  if (!currentUser.value?.qq) gaps.push(' QQ 号')
  if (!currentUser.value?.mcId) gaps.push(' Minecraft ID')
  return gaps.join(' 与')
})

const lastApplicationDenied = computed(() =>
  Boolean(myApplication.value?.hasApplication && myApplication.value.status === 'denied')
)

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

/** 只有登录后才查得到自己的申请状态，未登录直接跳过（否则必然 403）。 */
async function loadMyApplication() {
  if (!isLoggedIn.value) {
    myApplication.value = null
    return
  }
  try {
    const res = await getMyBetaApplication()
    myApplication.value = res.data || null
    // 通知邮箱默认用账号邮箱，玩家仍可改成别的地址
    if (!applyEmail.value) applyEmail.value = currentUser.value?.email || ''
  } catch (e) {
    // 查不到就当作「没有申请记录」，让表单显示出来；提交时后端还会再拦一次
    myApplication.value = null
  }
}

function goLogin() {
  router.push({ path: '/auth/login', query: { redirect: '/beta' } })
}

function goRegister() {
  router.push({ path: '/auth/register', query: { redirect: '/beta' } })
}

function scrollToApply() {
  document.getElementById('beta-apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function submitApply() {
  // 再次确认登录态：会话可能在页面停留期间失效，与其提交后拿 403 不如先引导登录
  if (!isLoggedIn.value) {
    goLogin()
    return
  }
  if (!selectedPlanId.value || !applyReason.value) return

  applying.value = true
  try {
    await applyBeta({
      email: applyEmail.value || currentUser.value?.email || '',
      reason: applyReason.value,
      planId: Number(selectedPlanId.value)
    })
    await loadMyApplication()
    showNotice({
      title: '申请已提交',
      message: '我们会在审核完成后通过邮件通知你结果，请留意通知邮箱。',
      tone: 'success'
    })
    applyReason.value = ''
  } catch (e) {
    // 会话过期时 axios 拦截器已经把 token 清掉并跳登录页，这里不再叠一层弹窗
    if (e.response?.status === 401) {
      myApplication.value = null
      goLogin()
      return
    }
    showNotice({
      title: '申请提交失败',
      message: e.response?.data?.message || '服务暂时不可用，请稍后重试。',
      tone: 'danger',
      confirmText: '关闭'
    })
  } finally {
    applying.value = false
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

onMounted(() => {
  loadPlans()
  loadMyApplication()
})
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
.denied-msg { color: var(--text-secondary); margin-bottom: 24px; font-size: 15px; }
.denied-msg strong { color: var(--accent-primary); }
.denied-actions { padding-top: 24px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }

/* ---- 申请内测区 ---- */
.apply-block { max-width: 700px; margin: 0 auto 56px; }
.apply-lead { color: var(--text-secondary); font-size: 14px; line-height: 1.7; margin: -18px 0 24px; }
.apply-card { padding: 32px 32px 28px; }
.apply-icon { margin-bottom: 16px; }
.apply-icon .ns-icon { font-size: 34px; color: var(--accent-primary); }
.apply-icon.ok .ns-icon { color: var(--accent-green); }
.apply-heading { font-size: 19px; font-weight: 700; margin-bottom: 12px; text-align: center; }
.apply-heading-left { text-align: left; margin-bottom: 18px; }
.apply-text { color: var(--text-secondary); font-size: 14px; line-height: 1.75; text-align: center; }
.apply-text strong { color: var(--accent-primary); }
.apply-points { display: grid; gap: 8px; margin: 20px 0 4px; list-style: none; padding: 0 4px; }
.apply-points li { display: flex; align-items: flex-start; gap: 8px; font-size: 13px; line-height: 1.65; color: var(--text-secondary); }
.apply-points li .ns-icon { margin-top: 3px; color: var(--accent-primary); flex-shrink: 0; }
.apply-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; margin-top: 24px; }
.apply-approved { border-color: rgba(76,175,80,0.3); }
.apply-pending { border-color: rgba(255,140,0,0.35); }
.apply-receipt { display: flex; flex-direction: column; gap: 12px; margin: 18px 0 16px; padding: 18px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); }
.receipt-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.receipt-label { color: var(--text-muted); font-size: 13px; }
.receipt-value { font-weight: 600; font-size: 13px; text-align: right; word-break: break-all; }
.apply-identity { display: flex; flex-direction: column; gap: 12px; padding: 18px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); }
.identity-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.identity-label { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 13px; }
.identity-label .ns-icon { font-size: 14px; }
.identity-value { font-weight: 600; font-size: 14px; }
.identity-value.missing { color: #ffc107; font-weight: 500; }
.apply-note { font-size: 12px; color: var(--text-muted); line-height: 1.7; margin: 10px 0 18px; }
.apply-warn { display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px; margin-bottom: 18px; font-size: 13px; line-height: 1.65; color: #ffc107; border: 1px solid rgba(255,193,7,0.35); background: rgba(255,193,7,0.07); }
.apply-warn .ns-icon { margin-top: 2px; flex-shrink: 0; }
.apply-warn a { color: var(--accent-primary); text-decoration: underline; }
.apply-warn.info { color: var(--text-secondary); border-color: var(--border-color); background: rgba(255,255,255,0.02); }
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
  .beta { padding: 32px 18px 64px; }
  .search-form { flex-direction: column; }
  .apply-card { padding: 26px 20px 22px; }
  .apply-actions { flex-direction: column; }
  .apply-actions .ns-btn { justify-content: center; width: 100%; }
  .identity-row, .receipt-row { flex-direction: column; align-items: flex-start; gap: 4px; }
  .receipt-value { text-align: left; }
  .result-actions { flex-direction: column; }
  .result-actions .ns-btn { justify-content: center; }
}
</style>
