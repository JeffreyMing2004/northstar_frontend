import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '../stores/auth'

const routes = [
  { path: '/', name: 'Home', component: () => import('../views/HomeView.vue') },
  { path: '/leaderboard', name: 'Leaderboard', component: () => import('../views/LeaderboardView.vue') },
  { path: '/stats', name: 'Stats', component: () => import('../views/StatsView.vue') },
  { path: '/admin', name: 'Admin', component: () => import('../views/AdminView.vue'), meta: { requiresAdmin: true } },
  { path: '/profile/:playerId/stats', name: 'ProfileStats', component: () => import('../views/ProfileStatsView.vue'), props: true },
  { path: '/profile/:playerId', name: 'Profile', component: () => import('../views/ProfileView.vue'), props: true },
  { path: '/lobby', name: 'Lobby', component: () => import('../views/LobbyView.vue') },
  { path: '/docs', name: 'Docs', component: () => import('../views/DocsView.vue') },
  { path: '/legal/terms', name: 'Terms', component: () => import('../views/LegalView.vue'), props: { policyKey: 'terms' } },
  { path: '/legal/privacy', name: 'Privacy', component: () => import('../views/LegalView.vue'), props: { policyKey: 'privacy' } },
  { path: '/legal/cookies', name: 'Cookies', component: () => import('../views/LegalView.vue'), props: { policyKey: 'cookies' } },
  { path: '/beta', name: 'Beta', component: () => import('../views/BetaView.vue') },
  { path: '/feedback', name: 'Feedback', component: () => import('../views/FeedbackView.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/SettingsView.vue'), meta: { requiresAuth: true } },
  { path: '/auth/login', name: 'Login', component: () => import('../views/LoginView.vue') },
  { path: '/auth/register', name: 'Register', component: () => import('../views/RegisterView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const { isLoggedIn, currentUser } = useAuth()

  if ((to.path === '/auth/login' || to.path === '/auth/register') && isLoggedIn.value) {
    next('/')
  } else if (to.meta.requiresAuth && !isLoggedIn.value) {
    next({ path: '/auth/login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && !isLoggedIn.value) {
    next({ path: '/auth/login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresAdmin && currentUser.value?.role === 'user') {
    next('/')
  } else {
    next()
  }
})

export default router
