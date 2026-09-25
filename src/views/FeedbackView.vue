<template>
  <div class="feedback container">
    <div class="feedback-hero">
      <div class="feedback-badge">BUG REPORT</div>
      <h1 class="section-title">问题反馈</h1>
      <p class="feedback-desc">
        遇到 BUG？选择问题分类并描述复现步骤，我们会尽快排查处理。
        登录账号会自动读取你的用户名与 QQ，未登录请手动填写联系方式。
      </p>
    </div>

    <div v-if="loading" class="state-card ns-card">
      <NsIcon name="refresh" :size="36" />
      <p>正在加载账号信息…</p>
    </div>

    <div v-else-if="loadError" class="state-card ns-card">
      <NsIcon name="warning" :size="36" />
      <p>{{ loadError }}</p>
      <button class="ns-btn" @click="load"><NsIcon name="refresh" :size="15" /> 重试</button>
    </div>

    <div v-else-if="submitted" class="state-card ns-card success-card">
      <NsIcon name="check-circle" :size="44" />
      <h2>反馈已提交</h2>
      <p>感谢你的反馈，我们会尽快排查处理。</p>
      <div class="submitted-id">
        <span>提交编号</span>
        <strong>{{ submittedId }}</strong>
      </div>
      <button class="ns-btn" @click="resetForm"><NsIcon name="plus" :size="15" /> 再提交一条</button>
    </div>

    <form v-else class="ns-card feedback-form" @submit.prevent="submit">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">用户名 <span class="required">*</span></label>
          <div class="input-wrapper">
            <NsIcon name="user" class="input-icon" />
            <input v-model="form.username" type="text" class="ns-input" :disabled="isLoggedIn" maxlength="32" placeholder="请输入用户名" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">QQ 联系方式 <span class="required">*</span></label>
          <div class="input-wrapper">
            <NsIcon name="mail" class="input-icon" />
            <input v-model="form.qq" type="text" class="ns-input" :disabled="isLoggedIn" maxlength="16" placeholder="请输入 QQ 号" />
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">问题分类 <span class="required">*</span></label>
        <div class="input-wrapper select-wrapper">
          <NsIcon name="warning" class="input-icon" />
          <select v-model="form.category" class="ns-input feedback-select">
            <option value="" disabled>请选择问题分类</option>
            <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">问题描述 <span class="required">*</span></label>
        <textarea
          v-model="form.description"
          class="ns-input feedback-textarea"
          rows="7"
          maxlength="2000"
          placeholder="请描述遇到问题的场景、复现步骤和期望结果（建议附上发生时间、对局/房间信息）"
        ></textarea>
        <span class="form-count">{{ form.description.length }} / 2000</span>
      </div>

      <div v-if="error" class="form-error">
        <NsIcon name="warning" /> {{ error }}
      </div>

      <div class="form-actions">
        <button type="submit" class="ns-btn ns-btn-filled" :disabled="submitting">
          <NsIcon name="send" /> {{ submitting ? '提交中...' : '提交反馈' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { getProfile } from '../api/auth'
import { submitBugReport } from '../api/feedback'
import { useAuth } from '../stores/auth'
import NsIcon from '../components/NsIcon.vue'

const { isLoggedIn } = useAuth()

// 与后端 BugReportService.ALLOWED_CATEGORIES 保持一致
const categories = [
  '战备页bug',
  '战绩显示bug',
  '对局房间bug',
  '对局内bug',
  '胜利条件触发bug',
  '死亡后视角bug',
  '赛后结算bug',
  '所有的按键逻辑bug',
  '闪退及离开服务器后重回对局过程中的bug',
  '观战视角bug',
  '人机bug'
]

const loading = ref(false)
const loadError = ref('')
const submitted = ref(false)
const submittedId = ref('')
const submitting = ref(false)
const error = ref('')
const form = reactive({ username: '', qq: '', category: '', description: '' })

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await getProfile()
    const profile = res.data || {}
    form.username = profile.username || ''
    form.qq = profile.qq || ''
  } catch (e) {
    loadError.value = e.response?.data?.message || '账号信息加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  submitted.value = false
  submittedId.value = ''
  error.value = ''
  form.category = ''
  form.description = ''
  if (!isLoggedIn.value) {
    form.username = ''
    form.qq = ''
  }
}

async function submit() {
  error.value = ''
  if (!form.category) { error.value = '请选择问题分类'; return }
  if (!form.description.trim()) { error.value = '请填写问题描述'; return }
  if (!isLoggedIn.value) {
    if (!form.username.trim()) { error.value = '请填写用户名'; return }
    if (!form.qq.trim()) { error.value = '请填写 QQ 号'; return }
  }

  submitting.value = true
  try {
    const payload = { category: form.category, description: form.description }
    if (!isLoggedIn.value) {
      payload.username = form.username.trim()
      payload.qq = form.qq.trim()
    }
    const res = await submitBugReport(payload)
    submittedId.value = res.data?.reportNo || ''
    submitted.value = true
  } catch (e) {
    error.value = e.response?.data?.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (isLoggedIn.value) load()
})
</script>

<style scoped>
.feedback { padding: 40px 30px 80px; }
.feedback-hero { text-align: center; margin-bottom: 34px; }
.feedback-badge { display: inline-block; padding: 5px 14px; margin-bottom: 18px; border: 1px solid rgba(255,140,0,0.3); color: var(--accent-primary); font-family: 'Orbitron', monospace; font-size: 13px; font-weight: 700; letter-spacing: 4px; }
.feedback-hero .section-title { display: block; text-align: center; }
.feedback-hero .section-title::after { left: 50%; transform: translateX(-50%); }
.feedback-desc { color: var(--text-secondary); font-size: 15px; line-height: 1.8; margin-top: 12px; max-width: 640px; margin-left: auto; margin-right: auto; }

.state-card { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 40px 32px; text-align: center; color: var(--text-secondary); }
.state-card .ns-icon { color: var(--accent-primary); }
.success-card h2 { font-size: 20px; font-weight: 800; }
.success-card .ns-icon { color: var(--accent-green); }
.submitted-id { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 22px; background: rgba(255,140,0,0.08); border: 1px solid var(--border-color); }
.submitted-id span { font-size: 12px; color: var(--text-muted); letter-spacing: 1px; }
.submitted-id strong { font-family: 'Orbitron', monospace; font-size: 20px; font-weight: 800; color: var(--accent-primary); letter-spacing: 2px; }

.feedback-form { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; gap: 22px; padding: 30px; }
.feedback-form:hover { transform: none; box-shadow: none; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.5px; }
.required { color: var(--accent-red); }
.input-wrapper { display: flex; align-items: center; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); transition: all 0.3s; }
.input-wrapper:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 20px rgba(255,140,0,0.1); }
.input-icon { margin: 0 14px; font-size: 16px; color: var(--text-muted); }
.input-wrapper .ns-input { border: none; background: transparent; box-shadow: none; padding-left: 0; flex: 1; }
.input-wrapper .ns-input:disabled { color: var(--text-muted); cursor: not-allowed; }

.feedback-select { appearance: none; -webkit-appearance: none; padding-right: 40px; cursor: pointer; }
.select-wrapper { position: relative; }
.select-wrapper::after {
  content: '▾'; position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
  color: var(--text-muted); pointer-events: none; font-size: 14px;
}
.feedback-select option { background: var(--bg-card); color: var(--text-primary); }

.feedback-textarea { resize: vertical; min-height: 150px; line-height: 1.7; font-family: inherit; }
.form-count { align-self: flex-end; font-size: 12px; color: var(--text-muted); }

.form-error { background: rgba(244,67,54,0.1); border: 1px solid rgba(244,67,54,0.2); color: var(--accent-red); padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.form-actions { display: flex; justify-content: flex-end; }
.form-actions .ns-btn:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 640px) {
  .feedback { padding: 30px 16px 60px; }
  .form-row { grid-template-columns: 1fr; }
  .feedback-form { padding: 22px; }
}
</style>