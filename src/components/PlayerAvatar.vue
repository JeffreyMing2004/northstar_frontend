<template>
  <span class="ns-player-avatar" :style="{ width: size + 'px', height: size + 'px' }">
    <img
      v-if="!failed"
      :src="avatarUrl"
      :alt="`${displayLabel} 的头像`"
      referrerpolicy="no-referrer"
      @error="handleImageError"
    />
    <span v-else class="avatar-initial" :style="{ fontSize: Math.max(12, size * 0.38) + 'px' }">{{ initial }}</span>
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getMinecraftAvatar } from '../api/minecraft'

const props = defineProps({
  playerId: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 64
  },
  label: {
    type: String,
    default: ''
  }
})

const displayLabel = computed(() => props.label || props.playerId || '玩家')
const initial = computed(() => Array.from(displayLabel.value.trim())[0]?.toUpperCase() || '?')
const fallbackName = computed(() => {
  const value = Array.from(String(props.playerId || '').toLowerCase())
    .reduce((sum, char) => sum + char.codePointAt(0), 0)
  return value % 2 === 0 ? 'Steve' : 'Alex'
})
const fallbackUrl = computed(() => avatarUrlFor(fallbackName.value))
const avatarUrl = ref(fallbackUrl.value)
const failed = ref(false)
let requestVersion = 0

function avatarUrlFor(id) {
  return `https://mc-heads.net/avatar/${encodeURIComponent(id)}/128`
}

function handleImageError() {
  if (avatarUrl.value !== fallbackUrl.value) {
    avatarUrl.value = fallbackUrl.value
    return
  }
  failed.value = true
}

async function loadAvatar() {
  const version = ++requestVersion
  failed.value = false
  avatarUrl.value = fallbackUrl.value

  if (!props.playerId) return
  try {
    const res = await getMinecraftAvatar(props.playerId)
    if (version !== requestVersion || !res.data?.avatarUrl) return
    avatarUrl.value = res.data.avatarUrl
  } catch {
    // The deterministic Steve/Alex avatar remains available without the lookup service.
  }
}

watch(() => props.playerId, loadAvatar, { immediate: true })
</script>

<style scoped>
.ns-player-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--bg-card-hover);
}

.ns-player-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}

.avatar-initial {
  color: var(--accent-primary);
  font-family: 'Orbitron', sans-serif;
  font-weight: 800;
}
</style>
