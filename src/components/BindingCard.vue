<template>
  <section :class="['ns-card', 'bind-card', { 'is-locked': bound }]">
    <header class="bind-head">
      <h2 class="bind-title">
        <NsIcon :name="icon" :size="18" />
        <span>{{ title }}</span>
      </h2>
      <span :class="['bind-state', bound ? 'locked' : 'open']">
        <NsIcon :name="bound ? 'lock' : 'clock'" :size="13" />
        {{ bound ? '已锁定' : '待绑定' }}
      </span>
    </header>

    <p class="bind-desc">{{ desc }}</p>

    <!-- 已绑定：只读展示，不再渲染输入框，避免玩家误以为还能改 -->
    <div v-if="bound" class="bind-value-box">
      <div class="bind-value">{{ value }}</div>
      <div class="bind-meta">
        <span v-if="boundAt"><NsIcon name="clock" :size="12" /> 绑定于 {{ formatDate(boundAt) }}</span>
        <span class="bind-lock-tag"><NsIcon name="lock" :size="12" /> 不可更改</span>
      </div>
    </div>

    <!-- 未绑定：可提交一次 -->
    <template v-else>
      <label class="bind-field">
        <span class="bind-field-label">{{ fieldLabel }}</span>
        <input
          v-model.trim="model"
          class="ns-input"
          :placeholder="placeholder"
          :maxlength="maxlength"
          :disabled="saving"
          @keyup.enter="valid && (confirming = true)"
        />
      </label>

      <span v-if="model && !valid" class="field-hint error">
        <NsIcon name="close-circle" :size="12" /> {{ invalidHint }}
      </span>

      <div v-if="confirming" class="confirm-box">
        <p class="confirm-text">
          <NsIcon name="warning" :size="15" />
          <span>确认将 <strong>{{ model }}</strong> 绑定为你的{{ title }}？<em>绑定后不可更改。</em></span>
        </p>
        <div class="confirm-actions">
          <button class="ns-btn" type="button" :disabled="saving" @click="confirming = false">
            <NsIcon name="arrow-left" :size="14" /> 再想想
          </button>
          <button class="ns-btn ns-btn-filled" type="button" :disabled="saving" @click="submit">
            <NsIcon name="check" :size="14" /> {{ saving ? '绑定中...' : '确认绑定' }}
          </button>
        </div>
      </div>
      <button
        v-else
        class="ns-btn ns-btn-filled bind-submit"
        type="button"
        :disabled="!valid || saving"
        @click="confirming = true"
      >
        <NsIcon :name="icon" :size="14" /> 绑定{{ title }}
      </button>
    </template>

    <p v-if="bound && lockedNote" class="bind-note">
      <NsIcon name="warning" :size="13" /> {{ lockedNote }}
    </p>
    <p v-if="error" class="form-error"><NsIcon name="warning" :size="14" /> {{ error }}</p>
    <p v-if="ok" class="form-ok"><NsIcon name="check-circle" :size="14" /> {{ ok }}</p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import NsIcon from './NsIcon.vue'

const props = defineProps({
  icon: { type: String, default: 'lock' },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  fieldLabel: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  maxlength: { type: [String, Number], default: 32 },
  /** 当前输入是否合法（由父组件用同一份规则判定） */
  valid: { type: Boolean, default: false },
  invalidHint: { type: String, default: '' },
  /** 是否已经绑定过：一旦为 true 就只展示、不再提供输入 */
  bound: { type: Boolean, default: false },
  value: { type: String, default: '' },
  boundAt: { type: String, default: '' },
  lockedNote: { type: String, default: '' },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
  ok: { type: String, default: '' }
})

const emit = defineEmits(['submit'])
const model = defineModel({ type: String, default: '' })

const confirming = ref(false)

// 提交成功后收起二次确认框并清空输入；父组件把结果放在 ok 里作为成功信号
watch(() => props.ok, (message) => {
  if (message) {
    confirming.value = false
    model.value = ''
  }
})

function submit() {
  if (!props.valid || props.saving) return
  emit('submit', model.value)
}

function formatDate(value) {
  return value ? String(value).replace('T', ' ').slice(0, 16) : ''
}
</script>

<style scoped>
.bind-card { display: flex; flex-direction: column; gap: 14px; padding: 26px 24px; }
.bind-card.is-locked { border-color: rgba(76, 175, 80, 0.28); }

.bind-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.bind-title { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; }
.bind-title .ns-icon { color: var(--accent-primary); }
.bind-state { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; }
.bind-state.locked { background: rgba(76, 175, 80, 0.1); border: 1px solid rgba(76, 175, 80, 0.3); color: var(--accent-green); }
.bind-state.open { background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-color); color: var(--text-muted); }

.bind-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.7; }

.bind-value-box { padding: 16px 18px; background: rgba(76, 175, 80, 0.06); border: 1px solid rgba(76, 175, 80, 0.28); }
.bind-value { font-family: 'Orbitron', monospace; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; color: var(--text-primary); word-break: break-all; }
.bind-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 10px; font-size: 12px; color: var(--text-muted); }
.bind-meta .ns-icon { margin-right: 4px; }
.bind-lock-tag { display: inline-flex; align-items: center; color: var(--accent-green); font-weight: 600; }

.bind-field { display: flex; flex-direction: column; gap: 8px; }
.bind-field-label { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.5px; }

.bind-submit { justify-content: center; padding: 13px 20px; }
.bind-note { display: flex; align-items: flex-start; gap: 8px; padding: 11px 13px; background: rgba(255, 193, 7, 0.07); border: 1px solid rgba(255, 193, 7, 0.25); color: #ffc107; font-size: 12.5px; line-height: 1.7; }
.bind-note .ns-icon { margin-top: 2px; }

.field-hint { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); }
.field-hint.error { color: var(--accent-red); }

.confirm-box { padding: 15px; background: rgba(255, 140, 0, 0.06); border: 1px solid rgba(255, 140, 0, 0.3); }
.confirm-text { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 14px; font-size: 13px; color: var(--text-secondary); line-height: 1.7; }
.confirm-text .ns-icon { margin-top: 2px; color: var(--accent-primary); }
.confirm-text strong { color: var(--accent-primary); }
.confirm-text em { color: var(--accent-red); font-style: normal; font-weight: 700; }
.confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }
.confirm-actions .ns-btn { padding: 10px 18px; }

.ns-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.ns-btn:disabled:hover { background: transparent; color: var(--accent-primary); box-shadow: none; transform: none; }
.ns-btn-filled:disabled:hover { background: var(--accent-primary); color: #000; }

.form-error, .form-ok { display: flex; align-items: center; gap: 7px; padding: 10px 12px; font-size: 12.5px; line-height: 1.6; }
.form-error { background: rgba(244, 67, 54, 0.08); border: 1px solid rgba(244, 67, 54, 0.25); color: var(--accent-red); }
.form-ok { background: rgba(76, 175, 80, 0.08); border: 1px solid rgba(76, 175, 80, 0.25); color: var(--accent-green); }
</style>
