<template>
  <div class="auth-page">
    <div class="auth-bg"><div class="auth-grid"></div></div>
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <router-link to="/" class="auth-logo"><span class="auth-logo-icon">N</span></router-link>
          <h1 class="auth-title">创建账号</h1>
          <p class="auth-subtitle">加入 NorthStar MC竞技平台</p>
        </div>

        <div class="steps">
          <div :class="['step', { active: step >= 1, done: step > 1 }]">
            <span class="step-num">1</span>
            <span class="step-label">基本信息</span>
          </div>
          <div :class="['step-line', { active: step > 1 }]"></div>
          <div :class="['step', { active: step >= 2, done: step > 2 }]">
            <span class="step-num">2</span>
            <span class="step-label">安全设置</span>
          </div>
          <div :class="['step-line', { active: step > 2 }]"></div>
          <div :class="['step', { active: step >= 3 }]">
            <span class="step-num">3</span>
            <span class="step-label">完成注册</span>
          </div>
        </div>

        <form v-if="step === 1" class="auth-form" @submit.prevent="nextStep">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <div class="input-wrapper">
              <NsIcon name="user" class="input-icon" />
              <input v-model="form.username" type="text" class="ns-input auth-input" placeholder="3-16位字母数字下划线" />
            </div>
            <span v-if="form.username && !validUsername" class="field-hint error"><NsIcon name="close-circle" /> 用户名需3-16位，仅限字母数字下划线</span>
            <span v-else-if="form.username && validUsername" class="field-hint success"><NsIcon name="check-circle" /> 用户名可用</span>
          </div>

          <div class="form-group">
            <label class="form-label">邮箱</label>
            <div class="input-wrapper">
              <NsIcon name="mail" class="input-icon" />
              <input v-model="form.email" type="email" class="ns-input auth-input" placeholder="用于接收验证邮件" />
            </div>
            <span v-if="form.email && !validEmail" class="field-hint error"><NsIcon name="close-circle" /> 请输入有效的邮箱地址</span>
          </div>

          <div class="form-group">
            <label class="form-label">邮箱验证码</label>
            <div class="input-wrapper code-row">
              <NsIcon name="shield-check" class="input-icon" />
              <input v-model="form.emailCode" type="text" class="ns-input auth-input" placeholder="6位验证码" maxlength="6" />
              <button type="button" class="code-btn" :disabled="!validEmail || codeSending || codeCountdown > 0" @click="sendCode">
                {{ codeCountdown > 0 ? codeCountdown + 's' : codeSending ? '发送中...' : '获取验证码' }}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">QQ 号</label>
            <div class="input-wrapper">
              <NsIcon name="shield-check" class="input-icon" />
              <input v-model.trim="form.qq" type="text" class="ns-input auth-input" maxlength="11" placeholder="内测资格校验用，请填常用 QQ" />
            </div>
            <span v-if="form.qq && !validQq" class="field-hint error"><NsIcon name="close-circle" /> QQ 号应为 5-11 位数字</span>
            <span v-else-if="form.qq && validQq" class="field-hint success"><NsIcon name="check-circle" /> 进游戏校验时需填写同一个 QQ</span>
          </div>

          <div class="form-group">
            <label class="form-label">Minecraft ID（离线服，选填）</label>
            <div class="input-wrapper">
              <NsIcon name="gamepad" class="input-icon" />
              <input v-model.trim="form.mcId" type="text" class="ns-input auth-input" maxlength="16" placeholder="请输入您的ID（离线服）" />
            </div>
            <span v-if="form.mcId && !validMcId" class="field-hint error"><NsIcon name="close-circle" /> 3-16 位，仅限字母、数字和下划线</span>
            <span v-else-if="form.mcId" class="field-hint warning"><NsIcon name="warning" /> 注册后不可更改，请确认与实际登录的 ID 完全一致</span>
            <span v-else class="field-hint">绑定离线服 MC ID 可解锁专属战绩追踪；与 QQ 同为内测资格凭据，注册后不可更改</span>
          </div>

          <button type="submit" class="ns-btn ns-btn-filled auth-submit" :disabled="!canNext1">
            <NsIcon name="arrow-right" /> 下一步
          </button>
        </form>

        <form v-if="step === 2" class="auth-form" @submit.prevent="nextStep">
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="input-wrapper">
              <NsIcon name="lock" class="input-icon" />
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" class="ns-input auth-input" placeholder="至少8位，含字母和数字" />
              <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
                <NsIcon :name="showPwd ? 'eye' : 'eye-close'" />
              </button>
            </div>
            <div class="pwd-strength" v-if="form.password">
              <div class="strength-bars">
                <div :class="['bar', pwdStrength >= 1 ? strengthColor : '']"></div>
                <div :class="['bar', pwdStrength >= 2 ? strengthColor : '']"></div>
                <div :class="['bar', pwdStrength >= 3 ? strengthColor : '']"></div>
                <div :class="['bar', pwdStrength >= 4 ? strengthColor : '']"></div>
              </div>
              <span :class="['strength-text', strengthColor]">{{ strengthLabel }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">确认密码</label>
            <div class="input-wrapper">
              <NsIcon name="lock" class="input-icon" />
              <input v-model="form.confirmPwd" :type="showPwd ? 'text' : 'password'" class="ns-input auth-input" placeholder="再次输入密码" />
            </div>
            <span v-if="form.confirmPwd && form.password !== form.confirmPwd" class="field-hint error"><NsIcon name="close-circle" /> 两次密码不一致</span>
          </div>

          <div class="form-group">
            <label class="form-label">邀请码 (选填)</label>
            <div class="input-wrapper">
              <NsIcon name="gift" class="input-icon" />
              <input v-model="form.inviteCode" type="text" class="ns-input auth-input" placeholder="有邀请码可直接获得内测资格" />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="ns-btn" @click="step = 1"><NsIcon name="arrow-left" /> 上一步</button>
            <button type="submit" class="ns-btn ns-btn-filled" :disabled="!canNext2"><NsIcon name="arrow-right" /> 下一步</button>
          </div>
        </form>

        <div v-if="step === 3 && !registered" class="auth-form">
          <div class="confirm-section">
            <h3 class="confirm-title">确认注册信息</h3>
            <div class="confirm-list">
              <div class="confirm-row"><span class="confirm-label"><NsIcon name="user" /> 用户名</span><span class="confirm-value">{{ form.username }}</span></div>
              <div class="confirm-row"><span class="confirm-label"><NsIcon name="mail" /> 邮箱</span><span class="confirm-value">{{ form.email }}</span></div>
              <div class="confirm-row" v-if="form.qq"><span class="confirm-label"><NsIcon name="shield-check" /> QQ 号</span><span class="confirm-value">{{ form.qq }}</span></div>
              <div class="confirm-row" v-if="form.mcId"><span class="confirm-label"><NsIcon name="gamepad" /> 离线服 MC ID</span><span class="confirm-value">{{ form.mcId }}</span></div>
              <div class="confirm-row" v-if="form.inviteCode"><span class="confirm-label"><NsIcon name="gift" /> 邀请码</span><span class="confirm-value">{{ form.inviteCode }}</span></div>
            </div>
            <label class="checkbox-label agree-label">
              <input v-model="form.agree" type="checkbox" class="checkbox-input" />
              <span class="checkbox-text">
                我已阅读并同意
                <router-link to="/legal/terms" target="_blank">用户协议</router-link>
                和
                <router-link to="/legal/privacy" target="_blank">隐私政策</router-link>
                ，并知悉
                <router-link to="/legal/cookies" target="_blank">Cookie 协议</router-link>
              </span>
            </label>
          </div>
          <div v-if="error" class="form-error"><NsIcon name="warning" /> {{ error }}</div>
          <div class="form-actions">
            <button type="button" class="ns-btn" @click="step = 2"><NsIcon name="arrow-left" /> 上一步</button>
            <button class="ns-btn ns-btn-filled" @click="handleRegister" :disabled="!form.agree || loading">
              <NsIcon name="check" /> {{ loading ? '注册中...' : '完成注册' }}
            </button>
          </div>
        </div>

        <div v-if="registered" class="success-section animate-in">
          <div class="success-icon"><NsIcon name="check-circle" /></div>
          <h2 class="success-title">注册成功！</h2>
          <p class="success-msg">欢迎加入 NorthStar，{{ form.username }}</p>
          <p v-if="registeredBeta" class="success-beta">已自动检测并关联内测资格</p>
          <p class="success-hint">验证邮件已发送至 {{ form.email }}，请查收</p>
          <router-link to="/" class="ns-btn ns-btn-filled auth-submit" style="margin-top:24px">
            <NsIcon name="login" /> 进入平台
          </router-link>
        </div>

        <div class="auth-footer" v-if="!registered">
          已有账号？<router-link to="/auth/login" class="auth-link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { registerApi, sendCodeApi } from '../api/auth'
import { useAuth } from '../stores/auth'

const router = useRouter()
const { login } = useAuth()
const step = ref(1)
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')
const registered = ref(false)
const registeredBeta = ref(false)
const form = reactive({ username: '', email: '', qq: '', mcId: '', password: '', confirmPwd: '', inviteCode: '', emailCode: '', agree: false })
const codeSending = ref(false)
const codeCountdown = ref(0)
let countdownTimer = null

const validUsername = computed(() => /^[a-zA-Z0-9_]{3,16}$/.test(form.username))
const validEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
// QQ 号是内测资格校验的键之一，与客户端 Mod 填的必须是同一个，因此注册时就要求填
const validQq = computed(() => /^[1-9]\d{4,10}$/.test(form.qq))
// Minecraft ID 同样只在注册时绑定一次，格式与后端 McIdFormat 保持一致（留空表示暂不绑定）
const validMcId = computed(() => !form.mcId || /^[a-zA-Z0-9_]{3,16}$/.test(form.mcId))
const canNext1 = computed(() => validUsername.value && validEmail.value && validQq.value && validMcId.value && form.emailCode.length === 6)
const pwdStrength = computed(() => {
  let s = 0; if (form.password.length >= 8) s++;
  if (/[a-z]/.test(form.password) && /[A-Z]/.test(form.password)) s++;
  if (/[0-9]/.test(form.password)) s++; if (/[^a-zA-Z0-9]/.test(form.password)) s++; return s
})
const strengthColor = computed(() => { if (pwdStrength.value <= 1) return 'weak'; if (pwdStrength.value === 2) return 'fair'; if (pwdStrength.value === 3) return 'good'; return 'strong' })
const strengthLabel = computed(() => { if (pwdStrength.value <= 1) return '弱'; if (pwdStrength.value === 2) return '一般'; if (pwdStrength.value === 3) return '良好'; return '强' })
const canNext2 = computed(() => form.password.length >= 8 && form.password === form.confirmPwd)

async function sendCode() {
  if (codeSending.value || codeCountdown.value > 0) return
  codeSending.value = true
  try {
    await sendCodeApi(form.email)
    codeCountdown.value = 60
    countdownTimer = setInterval(() => {
      codeCountdown.value--
      if (codeCountdown.value <= 0) clearInterval(countdownTimer)
    }, 1000)
  } catch (e) { error.value = e.response?.data?.message || '验证码发送失败' }
  finally { codeSending.value = false }
}

function nextStep() { if (step.value === 1 && canNext1.value) step.value = 2; else if (step.value === 2 && canNext2.value) step.value = 3 }

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    const res = await registerApi({
      username: form.username,
      password: form.password,
      email: form.email,
      qq: form.qq,
      mcId: form.mcId || null,
      emailCode: form.emailCode
    })
    const { login: authLogin } = useAuth()
    authLogin(res.data.user, res.data.token)
    registeredBeta.value = res.data.user?.betaStatus === 'approved'
    step.value = 4
  } catch (e) { error.value = e.response?.data?.message || '注册失败，请稍后重试' }
  finally { loading.value = false }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; padding: 80px 0 40px; }
.auth-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%, rgba(255,140,0,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(76,175,80,0.04) 0%, transparent 40%), var(--bg-primary); }
.auth-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,140,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,140,0,0.03) 1px, transparent 1px); background-size: 40px 40px; mask-image: radial-gradient(ellipse at center, black 20%, transparent 60%); }
.auth-container { position: relative; z-index: 1; width: 100%; max-width: 480px; padding: 20px; }
.auth-card { background: var(--bg-card); border: 1px solid var(--border-color); padding: 40px 36px; animation: fadeInUp 0.5s ease-out; }
.auth-header { text-align: center; margin-bottom: 32px; }
.auth-logo { display: inline-flex; margin-bottom: 20px; }
.auth-logo-icon { width: 56px; height: 56px; background: var(--accent-primary); color: #000; font-weight: 900; font-size: 28px; display: flex; align-items: center; justify-content: center; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); font-family: 'Courier New', monospace; }
.auth-title { font-size: 26px; font-weight: 800; margin-bottom: 8px; }
.auth-subtitle { color: var(--text-secondary); font-size: 14px; }
.steps { display: flex; align-items: center; justify-content: center; margin-bottom: 32px; }
.step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.step-num { width: 32px; height: 32px; border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', monospace; font-weight: 800; font-size: 14px; color: var(--text-muted); transition: all 0.3s; }
.step.active .step-num { border-color: var(--accent-primary); color: var(--accent-primary); background: rgba(255,140,0,0.1); }
.step.done .step-num { border-color: var(--accent-green); color: var(--accent-green); background: rgba(76,175,80,0.1); }
.step-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.step.active .step-label { color: var(--accent-primary); }
.step-line { width: 60px; height: 2px; background: var(--border-color); margin: 0 8px; margin-bottom: 22px; transition: background 0.3s; }
.step-line.active { background: var(--accent-green); }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.5px; }
.input-wrapper { display: flex; align-items: center; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); transition: all 0.3s; }
.input-wrapper:focus-within { border-color: var(--accent-primary); box-shadow: 0 0 20px rgba(255,140,0,0.1); }
.input-icon { padding: 0 14px; font-size: 16px; color: var(--text-muted); }
.auth-input { border: none !important; background: transparent !important; box-shadow: none !important; flex: 1; padding-left: 0; }
.pwd-toggle { background: none; border: none; padding: 0 14px; cursor: pointer; transition: opacity 0.3s; opacity: 0.5; display: flex; align-items: center; }
.pwd-toggle:hover { opacity: 1; }
.pwd-toggle .ns-icon { font-size: 16px; color: var(--text-muted); }
.field-hint { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
.field-hint .ns-icon { font-size: 12px; }
.field-hint.error { color: var(--accent-red); }
.field-hint.warning { color: #ffc107; }
.field-hint.success { color: var(--accent-green); }
.pwd-strength { display: flex; align-items: center; gap: 10px; }
.strength-bars { display: flex; gap: 4px; flex: 1; }
.strength-bars .bar { height: 4px; flex: 1; background: rgba(255,255,255,0.08); transition: background 0.3s; }
.strength-bars .bar.weak { background: var(--accent-red); }
.strength-bars .bar.fair { background: #ffc107; }
.strength-bars .bar.good { background: var(--accent-blue); }
.strength-bars .bar.strong { background: var(--accent-green); }
.strength-text { font-size: 12px; font-weight: 600; min-width: 28px; }
.strength-text.weak { color: var(--accent-red); }
.strength-text.fair { color: #ffc107; }
.strength-text.good { color: var(--accent-blue); }
.strength-text.strong { color: var(--accent-green); }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.checkbox-input { accent-color: var(--accent-primary); width: 16px; height: 16px; }
.checkbox-text { font-size: 13px; color: var(--text-secondary); }
.checkbox-text a { color: var(--accent-primary); text-decoration: none; }
.form-error { background: rgba(244,67,54,0.1); border: 1px solid rgba(244,67,54,0.2); color: var(--accent-red); padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.form-error .ns-icon { font-size: 14px; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; }
.form-actions .ns-btn { min-width: 120px; justify-content: center; }
.form-actions .ns-icon { margin-right: 4px; }
.auth-submit { width: 100%; justify-content: center; padding: 14px; font-size: 16px; }
.auth-submit .ns-icon { margin-right: 6px; }
.auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.confirm-section { margin-bottom: 24px; }
.confirm-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.confirm-list { display: flex; flex-direction: column; gap: 12px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); margin-bottom: 20px; }
.confirm-row { display: flex; justify-content: space-between; }
.confirm-label { color: var(--text-muted); font-size: 14px; display: flex; align-items: center; gap: 8px; }
.confirm-label .ns-icon { font-size: 13px; }
.confirm-value { font-weight: 600; font-size: 14px; }
.agree-label { margin-top: 4px; }
.success-section { text-align: center; padding: 20px 0; }
.success-icon { margin-bottom: 20px; }
.success-icon .ns-icon { font-size: 64px; color: var(--accent-green); }
.success-title { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
.success-msg { font-size: 16px; margin-bottom: 8px; }
.success-beta { color: var(--accent-green); font-size: 14px; font-weight: 700; margin-bottom: 8px; }
.success-hint { font-size: 14px; color: var(--text-muted); }
.auth-footer { text-align: center; margin-top: 28px; font-size: 14px; color: var(--text-secondary); }
.auth-link { color: var(--accent-primary); font-weight: 600; text-decoration: none; }
.auth-link:hover { text-decoration: underline; }
.code-row { gap: 0; }
.code-row .auth-input { flex: 1; }
.code-btn { background: rgba(255,140,0,0.12); border: none; border-left: 1px solid var(--border-color); color: var(--accent-primary); font-size: 13px; font-weight: 600; padding: 14px 18px; cursor: pointer; white-space: nowrap; transition: all 0.3s; }
.code-btn:hover:not(:disabled) { background: rgba(255,140,0,0.2); }
.code-btn:disabled { opacity: 0.5; cursor: not-allowed; color: var(--text-muted); }
</style>
