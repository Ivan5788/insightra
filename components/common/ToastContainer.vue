<script setup lang="ts">
import type { IconName } from '~/data/icons'

const { tt } = useI18n()

/** Renders global toasts. aria-live makes screen readers announce them. */
const ui = useUiStore()

const ICON: Record<string, IconName> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
}
</script>

<template>
  <div class="toast-region" aria-live="polite" aria-relevant="additions">
    <TransitionGroup name="toast">
      <div
        v-for="toast in ui.toasts"
        :key="toast.id"
        class="toast"
        :class="'toast--' + toast.type"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <AppIcon :name="ICON[toast.type] ?? 'info'" :size="18" class="toast__icon" />
        <div class="toast__body">
          <p class="toast__title">{{ toast.title }}</p>
          <p v-if="toast.message" class="toast__msg">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="toast__close"
          :aria-label="tt('Dismiss notification', '關閉通知')"
          @click="ui.dismissToast(toast.id)"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped lang="scss">
.toast-region {
  position: fixed;
  right: space(4);
  bottom: space(4);
  left: space(4);
  z-index: z('toast');
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: space(2);
  pointer-events: none;

  @include up('sm') {
    left: auto;
    width: 380px;
  }
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: space(3);
  width: 100%;
  padding: space(3) space(3.5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--toast-color);
  border-radius: $radius-lg;
  box-shadow: var(--shadow-lg);
  pointer-events: auto;

  &--success {
    --toast-color: var(--color-success);
  }

  &--error {
    --toast-color: var(--color-danger);
  }

  &--warning {
    --toast-color: var(--color-warning);
  }

  &--info {
    --toast-color: var(--color-info);
  }

  &__icon {
    color: var(--toast-color);
    margin-top: 1px;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-weight: $font-weight-semibold;
  }

  &__msg {
    margin-top: 2px;
    font-size: fs('sm');
    color: var(--color-text-muted);
  }

  &__close {
    @include reset-button;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: $radius-sm;
    color: var(--color-text-muted);
    @include focus-ring(0);

    &:hover {
      background: var(--color-surface-hover);
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all $transition-base;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
