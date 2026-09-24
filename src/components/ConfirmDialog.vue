<!--
  站内确认弹窗 —— 取代 window.confirm。

  为什么要单独做一个：浏览器原生 confirm 无法定制文案结构（长说明只能挤在一段里、
  换行还得靠 \n），样式与本站在暗色 + 橙色描边风格下完全脱节，且移动端表现不可控。
  本组件用统一的面板样式呈现「标题 + 说明 + 要点列表」，支持 danger 语气与忙碌态。

  用法（声明式，推荐配一个 askConfirm() 辅助函数包成 Promise）：
    <ConfirmDialog
      :open="confirm.open" :title="confirm.title" :message="confirm.message"
      :details="confirm.details" :tone="confirm.tone" :confirm-text="confirm.confirmText"
      :busy="actionLoading" @confirm="onConfirmOk" @cancel="onConfirmCancel" />
-->
<template>
  <Teleport to="body">
    <Transition name="cd-fade">
      <div v-if="open" class="cd-overlay" @click.self="onCancel">
        <section
          class="cd-panel"
          :class="`tone-${tone}`"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="message ? bodyId : null"
        >
          <header class="cd-header">
            <span class="cd-badge" aria-hidden="true">
              <NsIcon :name="badgeIcon" :size="20" />
            </span>
            <div class="cd-heading">
              <span class="cd-kicker">{{ kicker }}</span>
              <h2 :id="titleId">{{ title }}</h2>
            </div>
          </header>

          <div class="cd-body">
            <p v-if="message" :id="bodyId" class="cd-message">{{ message }}</p>
            <ul v-if="details.length" class="cd-details">
              <li v-for="(line, index) in details" :key="index">
                <NsIcon name="arrow-right" :size="13" />
                <span>{{ line }}</span>
              </li>
            </ul>
            <slot />
          </div>

          <footer class="cd-actions">
            <button v-if="showCancel" type="button" class="cd-btn ghost" :disabled="busy" @click="onCancel">
              {{ cancelText }}
            </button>
            <button
              ref="confirmBtn"
              type="button"
              class="cd-btn solid"
              :disabled="busy"
              @click="onConfirm"
            >
              <span v-if="busy" class="cd-spinner" aria-hidden="true" />
              <NsIcon v-else :name="confirmIcon" :size="15" />
              {{ busy ? busyText : confirmText }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

let seq = 0

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '请确认操作' },
  message: { type: String, default: '' },
  /** 逐条要点，适合「会做什么 / 不会做什么」这类说明。 */
  details: { type: Array, default: () => [] },
  confirmText: { type: String, default: '确定' },
  cancelText: { type: String, default: '取消' },
  busyText: { type: String, default: '处理中…' },
  /** default = 橙色强调；danger = 红色（删除/清空等不可逆）；success = 绿色（结果告知）。 */
  tone: { type: String, default: 'default' },
  confirmIcon: { type: String, default: 'check' },
  kicker: { type: String, default: 'CONFIRM' },
  busy: { type: Boolean, default: false },
  /** 关掉取消按钮即变成「知道了」式的一次性提示。 */
  showCancel: { type: Boolean, default: true }
})

const emit = defineEmits(['confirm', 'cancel'])

const TONE_ICONS = { danger: 'warning', success: 'check-circle', default: 'question' }
const badgeIcon = computed(() => TONE_ICONS[props.tone] || TONE_ICONS.default)

const uid = ++seq
const titleId = `cd-title-${uid}`
const bodyId = `cd-body-${uid}`
const confirmBtn = ref(null)

function onConfirm() {
  if (props.busy) return
  emit('confirm')
}

// 取消/关闭永远放行：忙碌时也要能被关掉，否则用户会被卡在弹窗里。
function onCancel() {
  emit('cancel')
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    onCancel()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      await nextTick()
      confirmBtn.value?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    }
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.cd-overlay {
  position: fixed;
  inset: 0;
  z-index: 2600;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.72);
}

.cd-panel {
  width: min(440px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  border: 1px solid var(--border-hover);
  border-left: 4px solid var(--accent-primary);
  background: var(--bg-card);
  padding: 24px 26px 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 140, 0, 0.08);
}

.cd-panel.tone-danger {
  border-left-color: var(--accent-red);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6), 0 0 24px rgba(244, 67, 54, 0.12);
}

.cd-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.cd-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 1px solid var(--border-hover);
  background: rgba(255, 140, 0, 0.12);
  color: var(--accent-primary);
}

.tone-danger .cd-badge {
  border-color: rgba(244, 67, 54, 0.4);
  background: rgba(244, 67, 54, 0.12);
  color: var(--accent-red);
}

.cd-heading {
  min-width: 0;
}

.cd-kicker {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.cd-heading h2 {
  margin-top: 4px;
  font-size: 18px;
  letter-spacing: 0.5px;
  color: var(--text-primary);
}

.cd-body {
  margin-top: 18px;
}

.cd-message {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.75;
}

.cd-details {
  margin-top: 12px;
  display: grid;
  gap: 8px;
  list-style: none;
}

.cd-details li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.cd-details li .ns-icon {
  margin-top: 2px;
  color: var(--accent-primary);
}

.tone-danger .cd-details li .ns-icon {
  color: var(--accent-red);
}

.cd-panel.tone-success {
  border-left-color: var(--accent-green);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6), 0 0 24px rgba(76, 175, 80, 0.12);
}

.tone-success .cd-badge {
  border-color: rgba(76, 175, 80, 0.4);
  background: rgba(76, 175, 80, 0.12);
  color: var(--accent-green);
}

.tone-success .cd-details li .ns-icon {
  color: var(--accent-green);
}

.tone-success .cd-btn.solid {
  background: var(--accent-green);
  border-color: var(--accent-green);
  color: #04220a;
}

.tone-success .cd-btn.solid:hover:not(:disabled) {
  background: #3d9c41;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.35);
}

.cd-actions {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cd-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.cd-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cd-btn.ghost {
  border-color: var(--border-color);
  background: transparent;
  color: var(--text-secondary);
}

.cd-btn.ghost:hover:not(:disabled) {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.cd-btn.solid {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #000;
}

.cd-btn.solid:hover:not(:disabled) {
  background: var(--accent-secondary);
  box-shadow: 0 0 20px var(--accent-glow);
}

.tone-danger .cd-btn.solid {
  background: var(--accent-red);
  border-color: var(--accent-red);
  color: #fff;
}

.tone-danger .cd-btn.solid:hover:not(:disabled) {
  background: #d63a2e;
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.35);
}

.cd-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(0, 0, 0, 0.25);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: cd-spin 0.7s linear infinite;
}

@keyframes cd-spin {
  to { transform: rotate(360deg); }
}

.cd-fade-enter-active,
.cd-fade-leave-active {
  transition: opacity 0.18s ease;
}

.cd-fade-enter-from,
.cd-fade-leave-to {
  opacity: 0;
}

.cd-fade-enter-active .cd-panel {
  animation: cd-pop 0.2s ease-out;
}

@keyframes cd-pop {
  from { opacity: 0; transform: translateY(10px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 480px) {
  .cd-panel {
    padding: 20px 18px 18px;
  }

  .cd-actions {
    flex-direction: column-reverse;
  }

  .cd-btn {
    justify-content: center;
    width: 100%;
  }
}
</style>
