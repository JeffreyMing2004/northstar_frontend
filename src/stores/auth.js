import { reactive, computed } from 'vue'

const state = reactive({
  user: JSON.parse(localStorage.getItem('ns_user') || 'null'),
  token: localStorage.getItem('ns_token') || ''
})

const isLoggedIn = computed(() => !!state.user)
const currentUser = computed(() => state.user)
const isAdmin = computed(() => state.user?.role === 'admin')

function login(user, token) {
  state.user = user
  state.token = token
  localStorage.setItem('ns_user', JSON.stringify(user))
  localStorage.setItem('ns_token', token)
}

function logout() {
  state.user = null
  state.token = ''
  localStorage.removeItem('ns_user')
  localStorage.removeItem('ns_token')
}

function updateProfile(data) {
  Object.assign(state.user, data)
  localStorage.setItem('ns_user', JSON.stringify(state.user))
}

export function useAuth() {
  return {
    isLoggedIn,
    currentUser,
    isAdmin,
    login,
    logout,
    updateProfile
  }
}
