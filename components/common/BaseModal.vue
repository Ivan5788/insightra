<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const { tt } = useI18n()

/**
 * Accessible modal dialog (role="dialog", aria-modal, focus trap, Esc to close).
 * Rendered with <Teleport> into <body> so parent overflow/z-index can't clip it.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    size?: 'sm' | 'md' | 'lg'
    /** Prevent closing by overlay click (e.g. forms with unsaved input). */
    persistent?: boolean
  }>(),
  { size: 'md' },
)

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const titleId = 'modal-title-' + useId()
const descId = 'modal-desc-' + useId()
useFocusTrap(
  panel,
  computed(() => props.open),
)

function onOverlay(): void {
  if (!props.persistent) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal" @keydown.esc="emit('close')">
        <div class="modal__overlay" aria-hidden="true" @click="onOverlay" />
        <div
          ref="panel"
          class="modal__panel"
          :class="'modal__panel--' + size"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descId : undefined"
          tabindex="-1"
        >
          <header class="modal__header">
            <div>
              <h2 :id="titleId" class="modal__title">{{ title }}</h2>
              <p v-if="description" :id="descId" class="modal__desc">{{ description }}</p>
            </div>
            <BaseButton
              variant="ghost"
              size="sm"
              icon="x"
              icon-only
              :label="tt('Close dialog', '關閉視窗')"
              @click="emit('close')"
            />
          </header>
          <div class="modal__body"><slot /></div>
          <footer v-if="$slots.footer" class="modal__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal {
  position: fixed;
  inset: 0;
  z-index: z('modal');
  display: flex;
  align-items: flex-end;
  justify-content: center;

  @include up('sm') {
    align-items: center;
    padding: space(4);
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: var(--color-overlay);
  }

  &__panel {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 92vh;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: $radius-xl $radius-xl 0 0;
    box-shadow: var(--shadow-lg);
    outline: none;

    @include up('sm') {
      border-radius: $radius-xl;
    }

    &--sm {
      max-width: 420px;
    }

    &--md {
      max-width: 560px;
    }

    &--lg {
      max-width: 780px;
    }
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: space(3);
    padding: space(5) space(5) space(3);
  }

  &__title {
    font-size: fs('lg');
    font-weight: $font-weight-semibold;
  }

  &__desc {
    margin-top: space(1);
    font-size: fs('sm');
    color: var(--color-text-muted);
  }

  &__body {
    padding: space(2) space(5) space(5);
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: space(2);
    padding: space(4) space(5);
    border-top: 1px solid var(--color-border);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity $transition-base;

  .modal__panel {
    transition: transform $transition-base;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal__panel {
    transform: translateY(16px);
  }
}
</style>
