<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

/**
 * Dropdown menu / popover.
 * Closes on outside click, Esc, and (optionally) after selecting an item.
 * The trigger slot receives `toggle`, `open` and aria attributes.
 *
 * The menu is anchored to the trigger, but on narrow screens a menu can be
 * wider than the space beside its trigger (e.g. a 300px filter menu under a
 * button near the left edge). After opening, it is shifted horizontally so it
 * always stays at least VIEWPORT_GAP px inside the viewport.
 */
const props = withDefaults(
  defineProps<{
    align?: 'left' | 'right'
    width?: string
    closeOnSelect?: boolean
    label?: string
  }>(),
  { align: 'left', width: '220px', closeOnSelect: true },
)

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const menuId = 'dropdown-' + useId()
const menu = ref<HTMLElement | null>(null)
const shift = ref(0)
const VIEWPORT_GAP = 12

/** Horizontal offset that keeps the menu inside the viewport. */
function place(): void {
  const el = menu.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const left = rect.left - shift.value // position without the current shift
  const right = left + rect.width
  const viewport = document.documentElement.clientWidth
  let next = 0
  if (right > viewport - VIEWPORT_GAP) next = viewport - VIEWPORT_GAP - right
  if (left + next < VIEWPORT_GAP) next = VIEWPORT_GAP - left
  shift.value = Math.round(next)
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  shift.value = 0
  await nextTick()
  place()
})

/** Moves the anchored edge (left or right) by the shift — plain offsets, no transform. */
const menuStyle = computed(() =>
  props.align === 'left'
    ? { width: props.width, left: shift.value + 'px' }
    : { width: props.width, right: -shift.value + 'px' },
)

function onResize(): void {
  if (open.value) place()
}

function toggle(): void {
  open.value = !open.value
}

function close(): void {
  open.value = false
}

function onDocumentClick(event: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

function onMenuClick(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (props.closeOnSelect && target.closest('[data-dropdown-item]')) close()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('resize', onResize)
})

defineExpose({ close, open })
</script>

<template>
  <div ref="root" class="dropdown" @keydown.esc.stop="close">
    <slot
      name="trigger"
      :toggle="toggle"
      :open="open"
      :attrs="{ 'aria-expanded': open, 'aria-haspopup': true, 'aria-controls': menuId }"
    />
    <Transition name="dropdown">
      <div
        v-if="open"
        :id="menuId"
        ref="menu"
        class="dropdown__menu"
        :class="'dropdown__menu--' + align"
        :style="menuStyle"
        :aria-label="label"
        @click="onMenuClick"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.dropdown {
  position: relative;
  display: inline-flex;

  &__menu {
    position: absolute;
    top: calc(100% + 6px);
    z-index: z('dropdown');
    max-width: calc(100vw - 24px);
    padding: space(1.5);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;
    box-shadow: var(--shadow-lg);

    &--left {
      left: 0;
    }

    &--right {
      right: 0;
    }
  }
}

:slotted(.dropdown-item) {
  @include reset-button;
  display: flex;
  align-items: center;
  gap: space(2.5);
  width: 100%;
  min-height: 36px;
  padding: space(2) space(2.5);
  border-radius: $radius-md;
  font-size: fs('base');
  color: var(--color-text);
  text-align: left;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    background: var(--color-surface-hover);
    text-decoration: none;
    outline: none;
  }

  &.is-active {
    color: var(--color-primary);
    font-weight: $font-weight-semibold;
  }

  &.is-danger {
    color: var(--color-danger);
  }
}

:slotted(.dropdown-divider) {
  height: 1px;
  margin: space(1.5) 0;
  background: var(--color-border);
}

:slotted(.dropdown-label) {
  padding: space(1.5) space(2.5) space(1);
  font-size: fs('xs');
  font-weight: $font-weight-semibold;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity $transition-fast,
    transform $transition-fast;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
