<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ label: string; description?: string; hideLabel?: boolean }>()
const model = defineModel<boolean>({ required: true })
const id = 'switch-' + useId()
</script>

<template>
  <div class="switch-row">
    <span v-if="!hideLabel" class="switch-row__text">
      <label :for="id" class="switch-row__label">{{ label }}</label>
      <span v-if="description" class="switch-row__desc">{{ description }}</span>
    </span>
    <button
      :id="id"
      type="button"
      role="switch"
      class="switch"
      :class="{ 'is-on': model }"
      :aria-checked="model"
      :aria-label="hideLabel ? label : undefined"
      @click="model = !model"
    >
      <span class="switch__thumb" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: space(4);

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-weight: $font-weight-medium;
    cursor: pointer;
  }

  &__desc {
    font-size: fs('sm');
    color: var(--color-text-muted);
  }
}

.switch {
  @include reset-button;
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  border-radius: $radius-full;
  background: var(--color-border-strong);
  transition: background-color $transition-fast;
  @include focus-ring;

  &__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
    transition: transform $transition-fast;
  }

  &.is-on {
    background: var(--color-primary);

    .switch__thumb {
      transform: translateX(18px);
    }
  }
}
</style>
