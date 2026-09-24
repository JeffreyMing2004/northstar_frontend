<template>
  <div class="app-container">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { getProfile } from './api/auth'
import { useAuth } from './stores/auth'

const { isLoggedIn, updateProfile } = useAuth()

onMounted(async () => {
  if (!isLoggedIn.value) return
  try {
    const res = await getProfile()
    updateProfile(res.data)
  } catch {
    // The API interceptor handles expired authentication.
  }
})
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main-content {
  flex: 1;
  padding-top: 70px;
}
</style>
