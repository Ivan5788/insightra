<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'

/**
 * Native <select> styled with the design system.
 * Native = free keyboard support, mobile pickers and screen reader support.
 * An empty string option represents "All" / no value.
 */
defineProps<{
  options: { value: T; label: string }[]
  label: string
  hideLabel?: boolean
  placeholder?: string
  size?: 'sm' | 'md'
}>()

const model = defineModel<T | ''>({ required: true })
const id = 'select-' + useId()
</script>

<template>
  <div class="field select-field" :class="size === 'sm' && 'select-field--sm'">
    <label :for="id" class="field__label" :class="{ 'sr-only': hideLabel }">{{ label }}</label>
    <select :id="id" v-model="model" class="select">
      <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
      <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>

<style scoped lang="scss">
.select-field--sm .select {
  min-height: 32px;
  font-size: fs('sm');
}
</style>
