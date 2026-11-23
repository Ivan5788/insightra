<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Floating "back to top" button.
 * Appears after the page has been scrolled down a bit, scrolls smoothly
 * (instantly when the user prefers reduced motion), then moves keyboard
 * focus to the main content so screen-reader / keyboard users land at the
 * top as well.
 */
const props = withDefaults(defineProps<{ threshold?: number; focusTarget?: string }>(), {
  threshold: 400,
  focusTarget: '#main',
})

const { tt } = useI18n()
const visible = ref(false)
let frame = 0

function update(): void {
  frame = 0
  visible.value = window.scrollY > props.threshold
}

function onScroll(): void {
  if (!frame) frame = requestAnimationFrame(update)
}

function scrollToTop(): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  document.querySelector<HTMLElement>(props.focusTarget)?.focus({ preventScroll: true })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  update()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <Transition name="back-to-top">
    <button
      v-if="visible"
      type="button"
      class="back-to-top"
      :aria-label="tt('Back to top', '回到頂部')"
      :title="tt('Back to top', '回到頂部')"
      data-testid="back-to-top"
      @click="scrollToTop"
    >
      <AppIcon name="arrow-up" :size="20" />
    </button>
  </Transition>
</template>

<style scoped lang="scss">
.back-to-top {
  @include reset-button;
  position: fixed;
  right: space(4);
  bottom: calc(#{space(4)} + env(safe-area-inset-bottom, 0px));
  z-index: z('sticky');
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: $touch-target;
  height: $touch-target;
  border-radius: 50%;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  transition:
    background $transition-fast,
    color $transition-fast;

  &:hover {
    color: var(--color-primary);
    background: var(--color-surface-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  @include up('lg') {
    right: space(6);
    bottom: space(6);
  }
}

.back-to-top-enter-active,
.back-to-top-leave-active {
  transition:
    opacity $transition-base,
    transform $transition-base;
}

.back-to-top-enter-from,
.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
