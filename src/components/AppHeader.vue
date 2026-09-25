<template>
  <header class="ns-header">
    <div class="header-inner">
      <router-link to="/" class="logo">
        <span class="logo-icon">N</span>
        <span class="logo-text">NORTHSTAR</span>
      </router-link>
      <nav class="nav-links">
        <router-link to="/" exact-active-class="active">首页</router-link>
        <router-link to="/leaderboard" active-class="active">排行榜</router-link>
        <router-link to="/stats" active-class="active">战绩查询</router-link>
        <router-link to="/lobby" active-class="active">房间大厅</router-link>
        <router-link to="/docs" active-class="active">文档中心</router-link>
        <router-link to="/beta" active-class="active">内测资格</router-link>
        <router-link to="/feedback" active-class="active">问题反馈</router-link>
        <router-link v-if="isAdmin" to="/admin" active-class="active">管理</router-link>
      </nav>
      <div class="header-actions">
        <template v-if="!isLoggedIn">
          <router-link to="/auth/login" class="btn-login">登录</router-link>
          <router-link to="/auth/register" class="btn-register">注册</router-link>
        </template>
        <template v-else>
          <div class="user-menu" @click="showMenu = !showMenu">
            <PlayerAvatar class="user-avatar" :player-id="currentUser.mcId || currentUser.username" :label="currentUser.username" :size="32" />
            <span class="user-name">{{ currentUser.username }}</span>
            <span class="menu-arrow" :class="{ open: showMenu }">▼</span>
          </div>
          <div v-if="showMenu" class="dropdown-menu">
            <div class="dropdown-header">
              <PlayerAvatar class="dropdown-avatar" :player-id="currentUser.mcId || currentUser.username" :label="currentUser.username" :size="40" />
              <div class="dropdown-info">
                <span class="dropdown-name">{{ currentUser.username }}</span>
                <span class="dropdown-email">{{ currentUser.email }}</span>
              </div>
            </div>
            <div class="dropdown-divider"></div>
            <router-link :to="`/profile/${encodeURIComponent(currentUser.mcId || currentUser.username)}`" class="dropdown-item" @click="showMenu = false">
              <NsIcon name="user" /> 个人主页
            </router-link>
            <router-link :to="`/profile/${encodeURIComponent(currentUser.mcId || currentUser.username)}/stats`" class="dropdown-item" @click="showMenu = false">
              <NsIcon name="chart" /> 我的战绩
            </router-link>
            <router-link to="/lobby" class="dropdown-item" @click="showMenu = false">
              <NsIcon name="home" /> 房间大厅
            </router-link>
            <router-link to="/beta" class="dropdown-item" @click="showMenu = false">
              <NsIcon name="key" /> 内测资格
            </router-link>
            <router-link to="/feedback" class="dropdown-item" @click="showMenu = false">
              <NsIcon name="warning" /> 问题反馈
            </router-link>
            <router-link to="/settings" class="dropdown-item" @click="showMenu = false">
              <NsIcon name="settings" /> 账号设置
            </router-link>
            <router-link v-if="isAdmin" to="/admin" class="dropdown-item" @click="showMenu = false">
              <NsIcon name="shield-check" /> 管理控制台
            </router-link>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item dropdown-logout" @click="handleLogout">
              <NsIcon name="login" /> 退出登录
            </button>
          </div>
        </template>
        <button
          class="hamburger"
          :class="{ open: mobileOpen }"
          :aria-expanded="mobileOpen"
          aria-label="打开菜单"
          @click="toggleMobileMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
    <div v-if="mobileOpen" class="mobile-menu">
      <nav class="mobile-nav">
        <router-link to="/" exact-active-class="active" @click="mobileOpen = false">首页</router-link>
        <router-link to="/leaderboard" active-class="active" @click="mobileOpen = false">排行榜</router-link>
        <router-link to="/stats" active-class="active" @click="mobileOpen = false">战绩查询</router-link>
        <router-link to="/lobby" active-class="active" @click="mobileOpen = false">房间大厅</router-link>
        <router-link to="/docs" active-class="active" @click="mobileOpen = false">文档中心</router-link>
        <router-link to="/beta" active-class="active" @click="mobileOpen = false">内测资格</router-link>
        <router-link to="/feedback" active-class="active" @click="mobileOpen = false">问题反馈</router-link>
        <router-link v-if="isAdmin" to="/admin" active-class="active" @click="mobileOpen = false">管理</router-link>
      </nav>
      <div class="mobile-divider"></div>
      <template v-if="!isLoggedIn">
        <router-link to="/auth/login" class="mobile-btn" @click="mobileOpen = false">登录</router-link>
        <router-link to="/auth/register" class="mobile-btn mobile-btn-filled" @click="mobileOpen = false">注册</router-link>
      </template>
      <template v-else>
        <div class="mobile-user">
          <PlayerAvatar class="mobile-user-avatar" :player-id="currentUser.mcId || currentUser.username" :label="currentUser.username" :size="36" />
          <div class="mobile-user-info">
            <span class="mobile-user-name">{{ currentUser.username }}</span>
            <span class="mobile-user-email">{{ currentUser.email }}</span>
          </div>
        </div>
        <router-link :to="`/profile/${encodeURIComponent(currentUser.mcId || currentUser.username)}`" class="mobile-user-link" @click="mobileOpen = false">
          <NsIcon name="user" /> 个人主页
        </router-link>
        <router-link :to="`/profile/${encodeURIComponent(currentUser.mcId || currentUser.username)}/stats`" class="mobile-user-link" @click="mobileOpen = false">
          <NsIcon name="chart" /> 我的战绩
        </router-link>
        <router-link to="/settings" class="mobile-user-link" @click="mobileOpen = false">
          <NsIcon name="settings" /> 账号设置
        </router-link>
        <button class="mobile-user-link mobile-logout" @click="handleLogout">
          <NsIcon name="login" /> 退出登录
        </button>
      </template>
    </div>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../stores/auth'
import PlayerAvatar from './PlayerAvatar.vue'

const router = useRouter()
const route = useRoute()
const { isLoggedIn, currentUser, isAdmin, logout } = useAuth()
const showMenu = ref(false)
const mobileOpen = ref(false)

function toggleMobileMenu() {
  mobileOpen.value = !mobileOpen.value
  if (mobileOpen.value) showMenu.value = false
}

function handleLogout() {
  logout()
  showMenu.value = false
  mobileOpen.value = false
  router.push('/')
}

watch(() => route.path, () => {
  showMenu.value = false
  mobileOpen.value = false
})

watch(mobileOpen, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const insideHeader = e.target instanceof Element && e.target.closest('.ns-header')
    if (!insideHeader) {
      showMenu.value = false
      mobileOpen.value = false
      return
    }
    const menu = document.querySelector('.user-menu')
    if (menu && !menu.contains(e.target)) {
      showMenu.value = false
    }
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      showMenu.value = false
      mobileOpen.value = false
    }
  })
}
</script>

<style scoped>
.ns-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: linear-gradient(180deg, rgba(15,15,15,0.98) 0%, rgba(20,25,20,0.95) 100%);
  border-bottom: 2px solid var(--accent-primary);
  z-index: 1000;
  backdrop-filter: blur(10px);
}
.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}
.logo-icon {
  width: 42px;
  height: 42px;
  background: var(--accent-primary);
  color: #000;
  font-weight: 900;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  font-family: 'Courier New', monospace;
}
.logo-text {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 0 20px var(--accent-glow);
}
.nav-links {
  display: flex;
  gap: 8px;
}
.nav-links a {
  color: #aaa;
  text-decoration: none;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s;
  position: relative;
  border: 1px solid transparent;
}
.nav-links a:hover {
  color: #fff;
  border-color: var(--accent-primary);
  background: rgba(255,165,0,0.08);
}
.nav-links a.active {
  color: var(--accent-primary);
  border-color: var(--accent-primary);
  background: rgba(255,165,0,0.12);
  text-shadow: 0 0 10px var(--accent-glow);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}
.btn-login {
  background: transparent;
  border: 2px solid var(--accent-primary);
  color: var(--accent-primary);
  padding: 8px 24px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}
.btn-login:hover {
  background: var(--accent-primary);
  color: #000;
  box-shadow: 0 0 20px var(--accent-glow);
}
.btn-register {
  background: var(--accent-primary);
  border: 2px solid var(--accent-primary);
  color: #000;
  padding: 8px 24px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}
.btn-register:hover {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
  color: #fff;
  box-shadow: 0 0 20px var(--accent-glow);
}
.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}
.user-menu:hover {
  border-color: var(--accent-primary);
  background: rgba(255,140,0,0.06);
}
.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}
.menu-arrow {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.3s;
}
.menu-arrow.open {
  transform: rotate(180deg);
}
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: 0 12px 40px rgba(0,0,0,0.6);
  z-index: 1001;
  animation: fadeInUp 0.2s ease-out;
}
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}
.dropdown-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
  font-weight: 800;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dropdown-info {
  display: flex;
  flex-direction: column;
}
.dropdown-name {
  font-weight: 700;
  font-size: 14px;
}
.dropdown-email {
  font-size: 12px;
  color: var(--text-muted);
}
.dropdown-divider {
  height: 1px;
  background: var(--border-color);
}
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  font-family: inherit;
}
.dropdown-item:hover {
  background: rgba(255,140,0,0.08);
  color: var(--text-primary);
}
.dropdown-logout {
  color: var(--accent-red);
}
.dropdown-logout:hover {
  background: rgba(244,67,54,0.08);
  color: var(--accent-red);
}
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  padding: 0 9px;
  background: transparent;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: border-color 0.3s;
}
.hamburger:hover {
  border-color: var(--accent-primary);
  background: rgba(255,140,0,0.06);
}
.hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background: var(--accent-primary);
  transition: transform 0.3s, opacity 0.3s;
}
.hamburger.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}
.hamburger.open span:nth-child(2) {
  opacity: 0;
}
.hamburger.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
.mobile-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: calc(100vh - 70px);
  overflow-y: auto;
  padding: 12px 20px 20px;
  background: rgba(12,14,12,0.98);
  border-bottom: 2px solid var(--accent-primary);
  box-shadow: 0 20px 40px rgba(0,0,0,0.6);
  animation: mobileMenuIn 0.25s ease-out;
}
@keyframes mobileMenuIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.mobile-nav {
  display: flex;
  flex-direction: column;
}
.mobile-nav a {
  color: var(--text-secondary);
  text-decoration: none;
  padding: 14px 12px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 2px;
  border-left: 2px solid transparent;
  transition: all 0.2s;
}
.mobile-nav a:hover {
  color: #fff;
  background: rgba(255,140,0,0.06);
}
.mobile-nav a.active {
  color: var(--accent-primary);
  border-left-color: var(--accent-primary);
  background: rgba(255,140,0,0.1);
  text-shadow: 0 0 10px var(--accent-glow);
}
.mobile-divider {
  height: 1px;
  background: var(--border-color);
  margin: 10px 0;
}
.mobile-btn {
  display: block;
  text-align: center;
  padding: 12px;
  margin-bottom: 10px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 2px;
  text-decoration: none;
  color: var(--accent-primary);
  border: 1px solid var(--accent-primary);
  transition: all 0.2s;
}
.mobile-btn:hover {
  background: rgba(255,140,0,0.1);
}
.mobile-btn-filled {
  background: var(--accent-primary);
  color: #000;
}
.mobile-btn-filled:hover {
  background: var(--accent-secondary);
  color: #fff;
}
.mobile-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
}
.mobile-user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  color: #000;
  font-weight: 800;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mobile-user-info {
  display: flex;
  flex-direction: column;
}
.mobile-user-name {
  font-weight: 700;
  font-size: 14px;
  color: var(--text-primary);
}
.mobile-user-email {
  font-size: 12px;
  color: var(--text-muted);
}
.mobile-user-link {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 8px;
  font-size: 14px;
  font-family: inherit;
  text-align: left;
  text-decoration: none;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.mobile-user-link:hover {
  background: rgba(255,140,0,0.08);
  color: var(--text-primary);
}
.mobile-logout {
  color: var(--accent-red);
}
.mobile-logout:hover {
  background: rgba(244,67,54,0.08);
  color: var(--accent-red);
}
@media (max-width: 1100px) {
  .nav-links,
  .btn-login,
  .btn-register {
    display: none;
  }
  .hamburger {
    display: flex;
  }
  .mobile-menu {
    display: block;
  }
  .header-inner {
    padding: 0 16px;
  }
}
@media (max-width: 480px) {
  .logo-text {
    font-size: 16px;
    letter-spacing: 2px;
  }
  .logo-icon {
    width: 34px;
    height: 34px;
    font-size: 18px;
  }
  .user-name,
  .menu-arrow {
    display: none;
  }
  .user-menu {
    padding: 4px 8px;
  }
}
</style>
