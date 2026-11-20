<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const { tt } = useI18n()

/** Side panel (drill-down explorer, mobile navigation). Full-screen on phones. */
const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    side?: 'left' | 'right'
    width?: string
    labelledBy?: string
  }>(),
  { side: 'right', width: '760px' },
)
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const titleId = 'drawer-title-' + useId()
useFocusTrap(
  panel,
  computed(() => props.open),
)
</script>

<template>
  <Teleport to="body">
    <Transition :name="'drawer-' + side">
      <div v-if="open" class="drawer" :class="'drawer--' + side" @keydown.esc="emit('close')">
        <div class="drawer__overlay" aria-hidden="true" @click="emit('close')" />
        <aside
          ref="panel"
          class="drawer__panel"
          :style="{ '--drawer-width': width }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelledBy ?? (title ? titleId : undefined)"
          tabindex="-1"
        >
          <header v-if="title || $slots.header" class="drawer__header">
            <slot name="header">
              <h2 :id="titleId" class="drawer__title">{{ title }}</h2>
            </slot>
            <BaseButton
              variant="ghost"
              size="sm"
              icon="x"
              icon-only
              :label="tt('Close panel', '關閉面板')"
              @click="emit('close')"
            />
          </header>
          <div class="drawer__body"><slot /></div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.drawer {
  position: fixed;
  inset: 0;
  z-index: z('drawer');
  display: flex;

  &--right {
    justify-content: flex-end;
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
    max-width: var(--drawer-width);
    height: 100%;
    background: var(--color-bg);
    box-shadow: var(--shadow-lg);
    outline: none;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: space(3);
    padding: space(4);
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);

    @include up('md') {
      padding: space(4) space(6);
    }
  }

  &__title {
    font-size: fs('lg');
    font-weight: $font-weight-semibold;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    overscroll-behavior: contain;
    @include scrollbar-thin;
  }
}

.drawer-right-enter-active,
.drawer-right-leave-active,
.drawer-left-enter-active,
.drawer-left-leave-active {
  transition: opacity $transition-base;

  .drawer__panel {
    transition: transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
}

.drawer-right-enter-from,
.drawer-right-leave-to,
.drawer-left-enter-from,
.drawer-left-leave-to {
  opacity: 0;
}

.drawer-right-enter-from .drawer__panel,
.drawer-right-leave-to .drawer__panel {
  transform: translateX(100%);
}

.drawer-left-enter-from .drawer__panel,
.drawer-left-leave-to .drawer__panel {
  transform: translateX(-100%);
}
</style>
