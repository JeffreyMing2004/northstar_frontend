<template>
  <div class="auth-page">
    <div class="auth-bg"><div class="auth-grid"></div></div>
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <router-link to="/" class="auth-logo"><span class="auth-logo-icon">N</span></router-link>
          <h1 class="auth-title">找回密码</h1>
          <p class="auth-subtitle">通过注册邮箱验证身份并设置新密码</p>
        </div>

        <div class="step-indicator" aria-label="找回密码进度">
          <div class="step-item" :class="{ active: step === 1, done: step > 1 }">
            <span class="step-number">{{ step > 1 ? '✓' : '1' }}</span>
            <span>验证邮箱</span>
          </div>
          <div class="step-line" :class="{ active: step > 1 }"></div>
          <div class="step-item" :class="{ active: step === 2, done: step > 2 }">
            <span class="step-number">{{ step > 2 ? '✓' : '2' }}</span>
            <span>确认账号</span>
          </div>
          <div class="step-line" :class="{ active: step > 2 }"></div>
          <div class="step-item" :class="{ active: step === 3 }">
            <span class="step-number">3</span>
            <span>修改密码</span>
          </div>
        </div>

        <form v-if="step === 1" class="auth-form" @submit.prevent="handleLookup">
          <div class="form-group">
            <label class="form-label">注册邮箱</label>
            <div class="input-wrapper">
              <NsIcon name="mail" class="input-icon" />
              <input v-model="email" type="email" class="ns-input auth-input"
                placeholder="输入注册时填写的邮箱" autocomplete="email" />
            </div>
          </div>

          <div v-if="error" class="form-error"><NsIcon name="warning" /> {{ error }}</div>

          <button type="submit" class="ns-btn ns-btn-filled auth-submit" :disabled="loading">
            <NsIcon name="search" /> {{ loading ? '查询中...' : '下一步' }}
          </button>
        </form>

        <form v-else-if="step === 2" class="auth-form" @submit.prevent="continueToPassword">
          <div class="identity-card">
            <div class="identity-row">
              <span class="identity-label">用户名</span>
              <span class="identity-value">{{ identity.username }}</span>
            </div>
            <div class="identity-row">
              <span class="identity-label">MC ID</span>
              <span class="identity-value">{{ identity.mcId || '未绑定' }}</span>
            </div>
            <div class="identity-row">
              <span class="identity-label">邮箱</span>
              <span class="identity-value">{{ identity.email }}</span>
            </div>
          </div>

          <div v-if="error" class="form-error"><NsIcon name="warning" /> {{ error }}</div>

          <p class="identity-help">请确认这是你的账号。点击下一步后，验证码将发送至 {{ identity.email }}</p>

          <button type="submit" class="ns-btn ns-btn-filled auth-submit" :disabled="loading || codeSending">
            <NsIcon name="mail" /> {{ codeSending ? '发送中...' : '获取验证码并下一步' }}
          </button>
          <button type="button" class="text-btn" @click="backToStep1">上一步</button>
        </form>

        <form v-else class="auth-form" @submit.prevent="handleReset">
          <div class="form-group">
            <label class="form-label">邮箱验证码</label>
            <div class="input-wrapper">
              <NsIcon name="shield" class="input-icon" />
              <input v-model.trim="form.emailCode" type="text" inputmode="numeric" class="ns-input auth-input code-input"
                placeholder="6位验证码" maxlength="6" autocomplete="one-time-code" />
              <button type="button" class="pwd-toggle code-btn"
                :disabled="codeSending || countdown > 0" @click="sendCode(false)">
                {{ codeBtnText }}
              </button>
            </div>
            <span class="field-hint">验证码 2 分钟内有效，超过 5 次输错需重新获取</span>
          </div>

          <div class="form-group">
            <label class="form-label">新密码</label>
            <div class="input-wrapper">
              <NsIcon name="lock" class="input-icon" />
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" class="ns-input auth-input"
                :placeholder="PASSWORD_HINT" autocomplete="new-password" />
              <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
                <NsIcon :name="showPwd ? 'eye' : 'eye-close'" />
              </button>
            </div>
            <span v-if="passwordError" class="field-hint error"><NsIcon name="close-circle" /> {{ passwordError }}</span>
            <span v-else class="field-hint">{{ PASSWORD_HINT }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">确认新密码</label>
            <div class="input-wrapper">
              <NsIcon name="lock" class="input-icon" />
              <input v-model="form.confirmPwd" :type="showPwd ? 'text' : 'password'" class="ns-input auth-input"
                placeholder="再输入一次新密码" autocomplete="new-password" />
            </div>
          </div>

          <div v-if="error" class="form-error"><NsIcon name="warning" /> {{ error }}</div>
          <div v-if="notice" class="form-notice"><NsIcon name="check" /> {{ notice }}</div>

          <button type="submit" class="ns-btn ns-btn-filled auth-submit" :disabled="loading || !canSubmitReset">
            <NsIcon name="login" /> {{ loading ? '提交中...' : '重置密码并登录' }}
          </button>
          <button type="button" class="text-btn" @click="step = 2">上一步</button>
        </form>

        <div class="auth-footer">
          想起密码了？<router-link to="/auth/login" class="auth-link">返回登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { forgotLookupApi, resetPasswordApi, sendCodeApi } from '../api/auth'
import { messageOf } from '../api'
import { PASSWORD_HINT, passwordIssue } from '../utils/password'

const router = useRouter()
const { login } = useAuth()

const step = ref(1)
const email = ref('')
const identity = reactive({ username: '', mcId: '', email: '' })
const form = reactive({ emailCode: '', password: '', confirmPwd: '' })
const showPwd = ref(false)
const loading = ref(false)
const codeSending = ref(false)
const error = ref('')
const notice = ref('')
const countdown = ref(0)
let countdownTimer = null

const validEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
// 空输入不报错，只在用户开始输入后才提示不合规的具体原因
const passwordError = computed(() => (form.password ? passwordIssue(form.password, '新密码') : ''))
// 重置密码必须满足后端密码策略（8-72 位、含字母和数字），否则提交后会被 400 打回
const canSubmitReset = computed(() =>
  form.emailCode.length === 6 && !passwordIssue(form.password) && form.password === form.confirmPwd)
const codeBtnText = computed(() => {
  if (codeSending.value) return '发送中'
  if (countdown.value > 0) return `${countdown.value}s 后重发`
  return '获取验证码'
})

async function handleLookup() {
  error.value = ''
  if (!validEmail.value) { error.value = '请输入有效的邮箱地址'; return }
  loading.value = true
  try {
    const res = await forgotLookupApi(email.value.trim())
    Object.assign(identity, res.data || {})
    step.value = 2
  } catch (e) {
    error.value = messageOf(e, '账号查询失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function sendCode(advanceAfterSend = false) {
  if (codeSending.value || countdown.value > 0) {
    if (advanceAfterSend && countdown.value > 0) step.value = 3
    return
  }
  error.value = ''
  notice.value = ''
  codeSending.value = true
  try {
    await sendCodeApi(identity.email, 'reset')
    notice.value = '验证码已发送，请查收邮箱（含垃圾邮件箱）'
    countdown.value = 60
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(countdownTimer)
    }, 1000)
    if (advanceAfterSend) step.value = 3
  } catch (e) {
    error.value = messageOf(e, '验证码发送失败，请稍后重试')
  } finally {
    codeSending.value = false
  }
}

function continueToPassword() {
  if (countdown.value > 0) {
    step.value = 3
  } else {
    sendCode(true)
  }
}

async function handleReset() {
  error.value = ''
  if (form.emailCode.length !== 6) { error.value = '请输入6位邮箱验证码'; return }
  const pwdIssue = passwordIssue(form.password, '新密码')
  if (pwdIssue) { error.value = pwdIssue; return }
  if (form.password !== form.confirmPwd) { error.value = '两次输入的密码不一致'; return }
  loading.value = true
  try {
    const res = await resetPasswordApi({
      email: identity.email,
      emailCode: form.emailCode,
      newPassword: form.password
    })
    login(res.data.user, res.data.token)
    router.push('/')
  } catch (e) {
    error.value = messageOf(e, '密码重置失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

function backToStep1() {
  step.value = 1
  error.value = ''
  notice.value = ''
  form.emailCode = ''
  form.password = ''
  form.confirmPwd = ''
  Object.assign(identity, { username: '', mcId: '', email: '' })
  if (countdownTimer) clearInterval(countdownTimer)
  countdown.value = 0
}

onUnmounted(() => { if (countdownTimer) clearInterval(countdownTimer) })
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; }
.auth-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%, rgba(255,140,0,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(76,175,80,0.04) 0%, transparent 40%), var(--bg-primary); }
.auth-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,140,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,140,0,0.03) 1px, transparent 1px); background-size: 40px 40px; mask-image: radial-gradient(ellipse at center, black 20%, transparent 60%); }
.auth-container { position: relative; z-index: 1; width: 100%; max-width: 440px; padding: 20px; }
.auth-card { background: var(--bg-card); border: 1px solid var(--border-color); padding: 40px 36px; animation: fadeInUp 0.5s ease-out; }
.auth-header { text-align: center; margin-bottom: 36px; }
.auth-logo { display: inline-flex; margin-bottom: 20px; }
.auth-logo-icon { width: 56px; height: 56px; background: var(--accent-primary); color: #000; font-weight: 900; font-size: 28px; display: flex; align-items: center; justify-content: center; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); font-family: 'Courier New', monospace; }
.auth-title { font-size: 26px; font-weight: 800; margin-bottom: 8px; }
.auth-subtitle { color: var(--text-secondary); font-size: 14px; }
.step-indicator { display: flex; align-items: center; margin: 0 0 28px; }
.step-item { display: flex; flex-direction: column; align-items: center; gap: 6px; color: var(--text-muted); font-size: 11px; flex-shrink: 0; }
.step-item.active { color: var(--accent-primary); }
.step-item.done { color: var(--accent-green, #4caf50); }
.step-number { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; border: 1px solid currentColor; font-size: 12px; font-weight: 700; }
.step-line { height: 1px; background: var(--border-color); flex: 1; margin: 0 10px 22px; }
.step-line.active { background: var(--accent-green, #4caf50); }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.5px; }
.input-wrapper { display: flex; align-items: center; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); transition: all 0.3s; }
.input-wrapper:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 20px rgba(255,140,0,0.1); }
.input-icon { margin: 0 14px; font-size: 16px; color: var(--text-muted); flex-shrink: 0; }
.auth-input { border: none !important; background: transparent !important; box-shadow: none !important; flex: 1; padding-left: 0; min-width: 0; }
.code-input { letter-spacing: 4px; font-family: 'Courier New', monospace; }
.pwd-toggle { background: none; border: none; padding: 0 14px; cursor: pointer; transition: opacity 0.3s; opacity: 0.5; display: flex; align-items: center; }
.pwd-toggle:hover { opacity: 1; }
.pwd-toggle .ns-icon { font-size: 16px; color: var(--text-muted); }
.code-btn { opacity: 1 !important; white-space: nowrap; font-size: 13px; color: var(--accent-primary); font-weight: 600; border-left: 1px solid var(--border-color); padding: 0 14px; }
.code-btn:disabled { color: var(--text-muted); cursor: not-allowed; }
.field-hint { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.field-hint .ns-icon { font-size: 12px; }
.field-hint.error { color: var(--accent-red); }
.identity-card { border: 1px solid rgba(255,140,0,0.25); background: rgba(255,140,0,0.06); padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; position: relative; }
.identity-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.identity-label { font-size: 12px; color: var(--text-secondary); flex-shrink: 0; }
.identity-value { font-size: 14px; font-weight: 600; word-break: break-all; text-align: right; }
.identity-help { color: var(--text-secondary); font-size: 13px; line-height: 1.7; text-align: center; }
.text-btn { border: 0; background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 13px; }
.text-btn:hover { color: var(--accent-primary); }
.form-error { background: rgba(244,67,54,0.1); border: 1px solid rgba(244,67,54,0.2); color: var(--accent-red); padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.form-error .ns-icon { font-size: 14px; }
.form-notice { background: rgba(76,175,80,0.1); border: 1px solid rgba(76,175,80,0.2); color: var(--accent-green, #4caf50); padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.form-notice .ns-icon { font-size: 14px; }
.auth-submit { width: 100%; justify-content: center; padding: 14px; font-size: 16px; }
.auth-submit .ns-icon { margin-right: 6px; }
.auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-footer { text-align: center; margin-top: 28px; font-size: 14px; color: var(--text-secondary); }
.auth-link { color: var(--accent-primary); font-weight: 600; text-decoration: none; }
.auth-link:hover { text-decoration: underline; }
</style>
