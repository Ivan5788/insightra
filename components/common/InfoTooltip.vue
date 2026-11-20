<script setup lang="ts">
/**
 * Accessible tooltip: appears on hover AND keyboard focus, linked with
 * aria-describedby so screen readers announce the explanation.
 * The bubble is display:none when hidden (v-show) so it never causes
 * horizontal scrolling, and it flips alignment near the viewport edges.
 */
import { nextTick, ref, useId } from 'vue'

const { tt } = useI18n()

withDefaults(defineProps<{ text: string; label?: string; placement?: 'top' | 'bottom' }>(), {
  label: undefined,
  placement: 'top',
})

const id = 'tip-' + useId()
const visible = ref(false)
const align = ref<'center' | 'start' | 'end'>('center')
const trigger = ref<HTMLElement | null>(null)

async function show(): Promise<void> {
  const rect = trigger.value?.getBoundingClientRect()
  if (rect) {
    const half = 140
    align.value = rect.left < half ? 'start' : window.innerWidth - rect.right < half ? 'end' : 'center'
  }
  visible.value = true
  await nextTick()
}

function hide(): void {
  visible.value = false
}
</script>

<template>
  <span class="tooltip" @mouseenter="show" @mouseleave="hide">
    <button
      ref="trigger"
      type="button"
      class="tooltip__trigger"
      :aria-label="label ?? tt('More information', '更多資訊')"
      :aria-describedby="id"
      @focus="show"
      @blur="hide"
      @keydown.esc="hide"
      @click.stop="visible ? hide() : show()"
    >
      <slot><AppIcon name="info" :size="14" /></slot>
    </button>
    <span
      v-show="visible"
      :id="id"
      role="tooltip"
      class="tooltip__bubble"
      :class="['tooltip__bubble--' + placement, 'tooltip__bubble--' + align]"
    >
      {{ text }}
    </span>
  </span>
</template>

<style scoped lang="scss">
.tooltip {
  position: relative;
  display: inline-flex;

  &__trigger {
    @include reset-button;
    display: inline-grid;
    place-items: center;
    color: var(--color-text-muted);
    border-radius: $radius-full;
    padding: 2px;
    @include focus-ring(1px);

    &:hover {
      color: var(--color-text);
    }
  }

  &__bubble {
    position: absolute;
    z-index: z('tooltip');
    width: max-content;
    max-width: min(260px, calc(100vw - 32px));
    padding: space(2) space(2.5);
    border-radius: $radius-md;
    background: var(--color-text);
    color: var(--color-surface);
    font-size: fs('xs');
    font-weight: $font-weight-regular;
    line-height: 1.45;
    text-align: left;
    white-space: normal;
    text-transform: none;
    letter-spacing: normal;
    box-shadow: var(--shadow-md);
    pointer-events: none;

    &--top {
      bottom: calc(100% + 6px);
    }

    &--bottom {
      top: calc(100% + 6px);
    }

    &--center {
      left: 50%;
      transform: translateX(-50%);
    }

    &--start {
      left: -4px;
    }

    &--end {
      right: -4px;
    }
  }
}
</style>
