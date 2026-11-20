<script setup lang="ts" generic="T extends string | number | boolean">
/** Compact single-choice control (e.g. Day / Week / Month). Uses radio semantics. */
defineProps<{
  options: { value: T; label: string; disabled?: boolean }[]
  label: string
  size?: 'sm' | 'md'
}>()

const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="segmented" :class="size === 'sm' && 'segmented--sm'" role="radiogroup" :aria-label="label">
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="radio"
      class="segmented__item"
      :class="{ 'is-active': model === opt.value }"
      :aria-checked="model === opt.value"
      :disabled="opt.disabled"
      @click="model = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.segmented {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: $radius-md;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  max-width: 100%;
  overflow-x: auto;

  &__item {
    @include reset-button;
    min-height: 28px;
    padding: 0 space(3);
    border-radius: $radius-sm;
    font-size: fs('sm');
    font-weight: $font-weight-medium;
    color: var(--color-text-secondary);
    white-space: nowrap;
    @include focus-ring(0);

    &:hover:not(:disabled) {
      color: var(--color-text);
    }

    &.is-active {
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: var(--shadow-sm);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  &--sm &__item {
    min-height: 24px;
    padding: 0 space(2);
    font-size: fs('xs');
  }
}
</style>
