<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'
import type { IconName } from '~/data/icons'

/**
 * Accessible tabs (WAI-ARIA tabs pattern): arrow keys move between tabs,
 * roving tabindex, aria-selected / aria-controls.
 * Generic over the tab key type → v-model is fully typed.
 */
const props = defineProps<{
  tabs: { key: T; label: string; icon?: IconName; badge?: string | number }[]
  label: string
}>()

const model = defineModel<T>({ required: true })
const baseId = 'tabs-' + useId()

function onKeydown(event: KeyboardEvent, index: number): void {
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % props.tabs.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + props.tabs.length) % props.tabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = props.tabs.length - 1
  else return
  event.preventDefault()
  model.value = props.tabs[next]!.key
  const el = document.getElementById(baseId + '-tab-' + props.tabs[next]!.key)
  el?.focus()
}
</script>

<template>
  <div class="tabs">
    <div class="tabs__list" role="tablist" :aria-label="label">
      <button
        v-for="(tab, i) in tabs"
        :id="baseId + '-tab-' + tab.key"
        :key="tab.key"
        type="button"
        role="tab"
        class="tabs__tab"
        :class="{ 'is-active': model === tab.key }"
        :aria-selected="model === tab.key"
        :aria-controls="baseId + '-panel'"
        :tabindex="model === tab.key ? 0 : -1"
        @click="model = tab.key"
        @keydown="onKeydown($event, i)"
      >
        <AppIcon v-if="tab.icon" :name="tab.icon" :size="16" />
        {{ tab.label }}
        <span v-if="tab.badge !== undefined" class="tabs__badge">{{ tab.badge }}</span>
      </button>
    </div>
    <div v-if="$slots.default" :id="baseId + '-panel'" role="tabpanel" class="tabs__panel" tabindex="0">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  &__list {
    display: flex;
    gap: space(1);
    overflow-x: auto;
    border-bottom: 1px solid var(--color-border);
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__tab {
    @include reset-button;
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: space(1.5);
    min-height: 40px;
    padding: 0 space(3);
    font-size: fs('base');
    font-weight: $font-weight-medium;
    color: var(--color-text-muted);
    white-space: nowrap;
    @include focus-ring(-2px);

    &:hover {
      color: var(--color-text);
    }

    &.is-active {
      color: var(--color-primary);

      &::after {
        content: '';
        position: absolute;
        left: space(2);
        right: space(2);
        bottom: -1px;
        height: 2px;
        border-radius: 2px;
        background: var(--color-primary);
      }
    }
  }

  &__badge {
    padding: 0 space(1.5);
    border-radius: $radius-full;
    background: var(--color-surface-2);
    font-size: fs('xs');
    color: var(--color-text-secondary);
  }

  &__panel {
    padding-top: space(4);
    outline: none;
  }
}
</style>
