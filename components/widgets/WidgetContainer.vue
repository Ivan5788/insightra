<script setup lang="ts">
/**
 * WidgetContainer — frame around every widget.
 *  View mode : title + "more" menu (hide widget, open settings…)
 *  Edit mode : drag handle, move ←/→ (keyboard & touch alternative to drag),
 *              size selector, settings, show/hide, remove.
 * The widget content itself is rendered through the default slot.
 */
import { computed } from 'vue'
import { WIDGET_REGISTRY, widgetLabel, widgetTitle } from '~/data/widget-registry'
import type { WidgetConfig, WidgetSize } from '~/types/widgets'

const { tt } = useI18n()

const props = defineProps<{
  widget: WidgetConfig
  editing: boolean
  index: number
  count: number
}>()

const emit = defineEmits<{
  remove: []
  hide: []
  toggleVisible: []
  resize: [size: WidgetSize]
  move: [direction: -1 | 1]
  settings: []
}>()

const def = computed(() => WIDGET_REGISTRY[props.widget.type])
const title = computed(() => widgetTitle(props.widget))
const SIZE_LABEL: Record<WidgetSize, string> = {
  sm: tt('Small', '小'),
  md: tt('Medium', '中'),
  lg: tt('Large', '大'),
  full: tt('Full width', '滿版'),
}
const isKpi = computed(() => props.widget.type === 'kpi')

function onSize(event: Event): void {
  emit('resize', (event.target as HTMLSelectElement).value as WidgetSize)
}
</script>

<template>
  <article
    class="widget"
    :class="[
      'widget--' + widget.size,
      { 'is-editing': editing, 'is-hidden': !widget.visible, 'widget--kpi': isKpi },
    ]"
    :data-widget-id="widget.id"
    :aria-label="title"
  >
    <div v-if="editing" class="widget__edit-bar">
      <button
        type="button"
        class="widget__handle"
        :aria-label="tt('Drag to reorder {x}', '拖曳調整「{x}」的順序', { x: title })"
        :title="tt('Drag to reorder', '拖曳調整順序')"
      >
        <AppIcon name="grip" :size="16" />
      </button>
      <span class="widget__type">{{ widgetLabel(widget.type) }}</span>
      <span v-if="!widget.visible" class="badge">{{ tt('Hidden', '已隱藏') }}</span>
      <div class="widget__edit-actions">
        <button
          type="button"
          class="widget__tool"
          :disabled="index === 0"
          :aria-label="tt('Move {x} earlier', '將「{x}」往前移', { x: title })"
          @click="emit('move', -1)"
        >
          <AppIcon name="arrow-left" :size="14" />
        </button>
        <button
          type="button"
          class="widget__tool"
          :disabled="index === count - 1"
          :aria-label="tt('Move {x} later', '將「{x}」往後移', { x: title })"
          @click="emit('move', 1)"
        >
          <AppIcon name="arrow-right" :size="14" />
        </button>
        <label class="sr-only" :for="'size-' + widget.id">{{ tt('Widget size', 'Widget 尺寸') }}</label>
        <select
          v-if="def.allowedSizes.length > 1"
          :id="'size-' + widget.id"
          class="widget__size select"
          :value="widget.size"
          @change="onSize"
        >
          <option v-for="s in def.allowedSizes" :key="s" :value="s">{{ SIZE_LABEL[s] }}</option>
        </select>
        <button
          type="button"
          class="widget__tool"
          :aria-label="tt('Settings for {x}', '「{x}」設定', { x: title })"
          @click="emit('settings')"
        >
          <AppIcon name="settings" :size="14" />
        </button>
        <button
          type="button"
          class="widget__tool"
          :aria-label="
            widget.visible
              ? tt('Hide {x}', '隱藏「{x}」', { x: title })
              : tt('Show {x}', '顯示「{x}」', { x: title })
          "
          :aria-pressed="!widget.visible"
          data-testid="widget-toggle-visible"
          @click="emit('toggleVisible')"
        >
          <AppIcon :name="widget.visible ? 'eye' : 'eye-off'" :size="14" />
        </button>
        <button
          type="button"
          class="widget__tool widget__tool--danger"
          :aria-label="tt('Remove {x}', '移除「{x}」', { x: title })"
          data-testid="widget-remove"
          @click="emit('remove')"
        >
          <AppIcon name="trash" :size="14" />
        </button>
      </div>
    </div>

    <header v-if="!isKpi" class="widget__header">
      <h2 class="widget__title">{{ title }}</h2>
      <div class="widget__header-actions">
        <slot name="actions" />
        <BaseDropdown
          v-if="!editing"
          align="right"
          width="200px"
          :label="tt('{x} options', '「{x}」選項', { x: title })"
        >
          <template #trigger="{ toggle, attrs }">
            <button
              type="button"
              class="widget__tool"
              v-bind="attrs"
              :aria-label="tt('{x} options', '「{x}」選項', { x: title })"
              @click="toggle"
            >
              <AppIcon name="more" :size="16" />
            </button>
          </template>
          <slot name="menu" />
          <button type="button" class="dropdown-item" data-dropdown-item @click="emit('hide')">
            <AppIcon name="eye-off" :size="16" /> {{ tt('Hide widget', '隱藏 Widget') }}
          </button>
        </BaseDropdown>
      </div>
    </header>

    <div class="widget__body">
      <slot />
    </div>
  </article>
</template>

<style scoped lang="scss">
.widget {
  @include card-surface;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: space(4);
  transition:
    box-shadow $transition-fast,
    opacity $transition-fast;

  @include up('md') {
    padding: space(5);
  }

  &--kpi {
    padding: space(4);
  }

  &.is-editing {
    border-style: dashed;
    border-color: var(--color-border-strong);
    padding-top: space(2);
  }

  &.is-hidden {
    opacity: 0.5;
  }

  &__edit-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: space(1.5);
    margin: 0 calc(-1 * space(2)) space(3);
    padding-bottom: space(2);
    border-bottom: 1px solid var(--color-border);
  }

  &__handle {
    @include reset-button;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: $radius-sm;
    color: var(--color-text-muted);
    cursor: grab;
    touch-action: none;
    @include focus-ring(0);

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }

    &:active {
      cursor: grabbing;
    }
  }

  &__type {
    font-size: fs('xs');
    font-weight: $font-weight-semibold;
    color: var(--color-text-muted);
    @include truncate;
  }

  // Wraps onto a second line on narrow (KPI-size) widgets instead of
  // overflowing the card and causing horizontal page scroll.
  &__edit-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    margin-left: auto;
    min-width: 0;
  }

  &--sm &__type {
    display: none;
  }

  &--sm &__edit-actions {
    flex: 1 1 100%;
    justify-content: flex-start;
  }

  &__size {
    width: auto;
    min-height: 28px;
    padding: 0 space(7) 0 space(2);
    font-size: fs('xs');
    background-position: right space(1.5) center;
  }

  &__tool {
    @include reset-button;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: $radius-sm;
    color: var(--color-text-muted);
    @include focus-ring(0);

    &:hover:not(:disabled) {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    &--danger:hover:not(:disabled) {
      color: var(--color-danger);
      background: var(--color-danger-soft);
    }

    @media (pointer: coarse) {
      width: 36px;
      height: 36px;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: space(2);
    margin-bottom: space(3);
  }

  &__title {
    font-size: fs('md');
    font-weight: $font-weight-semibold;
    @include truncate;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: space(1);
  }

  &__body {
    flex: 1;
    min-width: 0;
  }
}
</style>
