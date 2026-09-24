<template>
  <div class="auth-page">
    <div class="auth-bg"><div class="auth-grid"></div></div>
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <router-link to="/" class="auth-logo"><span class="auth-logo-icon">N</span></router-link>
          <h1 class="auth-title">欢迎回来</h1>
          <p class="auth-subtitle">登录你的 NorthStar 账号</p>
        </div>

        <form class="auth-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">账号</label>
            <div class="input-wrapper">
              <NsIcon name="user" class="input-icon" />
              <input v-model="form.username" type="text" class="ns-input auth-input"
                placeholder="用户名 / 邮箱" autocomplete="username" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="input-wrapper">
              <NsIcon name="lock" class="input-icon" />
              <input v-model="form.password" :type="showPwd ? 'text' : 'password'" class="ns-input auth-input"
                placeholder="输入密码" autocomplete="current-password" />
              <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
                <NsIcon :name="showPwd ? 'eye' : 'eye-close'" />
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input v-model="form.remember" type="checkbox" class="checkbox-input" />
              <span class="checkbox-text">记住我</span>
            </label>
            <a href="#" class="forgot-link">忘记密码？</a>
          </div>

          <div v-if="error" class="form-error">
            <NsIcon name="warning" /> {{ error }}
          </div>

          <button type="submit" class="ns-btn ns-btn-filled auth-submit" :disabled="loading">
            <NsIcon name="login" /> {{ loading ? '登录中...' : '登 录' }}
          </button>
        </form>

        <div class="auth-footer">
          还没有账号？<router-link to="/auth/register" class="auth-link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'
import { loginApi } from '../api/auth'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()
const form = reactive({ username: '', password: '', remember: false })
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  if (!form.username.trim()) { error.value = '请输入用户名或邮箱'; return }
  if (!form.password) { error.value = '请输入密码'; return }
  if (form.password.length < 6) { error.value = '密码长度不能少于6位'; return }
  loading.value = true
  try {
    const res = await loginApi({ username: form.username, password: form.password })
    login(res.data.user, res.data.token)
    router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch (e) { error.value = e.response?.data?.message || '登录失败，请检查账号密码' }
  finally { loading.value = false }
}
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
.form-options { display: flex; justify-content: space-between; align-items: center; }
.checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.checkbox-input { accent-color: var(--accent-primary); width: 16px; height: 16px; }
.checkbox-text { font-size: 13px; color: var(--text-secondary); }
.forgot-link { font-size: 13px; color: var(--accent-primary); text-decoration: none; }
.forgot-link:hover { text-decoration: underline; }
.form-error { background: rgba(244,67,54,0.1); border: 1px solid rgba(244,67,54,0.2); color: var(--accent-red); padding: 10px 14px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.form-error .ns-icon { font-size: 14px; }
.auth-submit { width: 100%; justify-content: center; padding: 14px; font-size: 16px; }
.auth-submit .ns-icon { margin-right: 6px; }
.auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.auth-footer { text-align: center; margin-top: 28px; font-size: 14px; color: var(--text-secondary); }
.auth-link { color: var(--accent-primary); font-weight: 600; text-decoration: none; }
.auth-link:hover { text-decoration: underline; }
</style>
