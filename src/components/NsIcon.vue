<template>
  <svg
    class="ns-icon"
    :style="iconStyle"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="path" fill="currentColor" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import icons, { FALLBACK_ICON } from '../assets/icons/mdi'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 16 },
  color: { type: String, default: '' }
})

const sizeNum = computed(() => typeof props.size === 'number' ? props.size : parseInt(props.size) || 16)

const path = computed(() => icons[props.name] || FALLBACK_ICON)

// 尺寸与颜色都走内联样式（width/height + currentColor），
// 这样各页面里既有的 font-size / color 覆盖规则仍然生效。
const iconStyle = computed(() => {
  const s = {}
  s.fontSize = sizeNum.value + "px"
  s.lineHeight = "1"
  s.width = sizeNum.value + "px"
  s.height = sizeNum.value + "px"
  if (props.color) s.color = props.color
  return s
})
</script>

<style scoped>
.ns-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  flex-shrink: 0;
  fill: currentColor;
}
</style>
