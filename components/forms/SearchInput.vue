<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const { tt } = useI18n()

/**
 * Search box with debounce: the model updates 300 ms after the user stops
 * typing, so we don't fire one API request per keystroke.
 */
const props = withDefaults(defineProps<{ placeholder?: string; label?: string; debounce?: number }>(), {
  placeholder: undefined,
  label: undefined,
  debounce: 300,
})

const model = defineModel<string>({ required: true })
const local = ref(model.value)
let timer: ReturnType<typeof setTimeout> | undefined

watch(local, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => (model.value = value), props.debounce)
})

watch(model, (value) => {
  if (value !== local.value) local.value = value
})

function clear(): void {
  clearTimeout(timer)
  local.value = ''
  model.value = ''
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="search">
    <AppIcon name="search" :size="16" class="search__icon" />
    <input
      v-model="local"
      type="search"
      class="input search__input"
      :placeholder="placeholder ?? tt('Search…', '搜尋…')"
      :aria-label="label ?? tt('Search', '搜尋')"
      @keydown.esc="clear"
    />
    <button
      v-if="local"
      type="button"
      class="search__clear"
      :aria-label="tt('Clear search', '清除搜尋')"
      @click="clear"
    >
      <AppIcon name="x" :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
.search {
  position: relative;
  width: 100%;

  &__icon {
    position: absolute;
    left: space(3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    pointer-events: none;
  }

  &__input {
    padding-left: space(9);
    padding-right: space(8);

    &::-webkit-search-cancel-button {
      display: none;
    }
  }

  &__clear {
    @include reset-button;
    position: absolute;
    right: space(2);
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: $radius-full;
    color: var(--color-text-muted);
    @include focus-ring(0);

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }
  }
}
</style>
