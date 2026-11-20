<script setup lang="ts">
/**
 * WidgetGrid (the "WidgetManager" surface) — renders the dashboard.
 *
 * View mode: a CSS grid of visible widgets.
 * Edit mode: the same grid wrapped in <draggable> (SortableJS). Dragging
 * reorders the `draft` ARRAY in the store via v-model — the order in the
 * data is the order on screen, so saving persists exactly what you see.
 *
 * Touch: SortableJS supports touch; `delay-on-touch-only` avoids hijacking
 * page scroll (press & hold ~200 ms to drag). The ←/→ buttons in each
 * widget offer a non-drag alternative for keyboard and screen-reader users.
 */
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'
import type { WidgetConfig } from '~/types/widgets'
import { widgetTitle } from '~/data/widget-registry'

const { tt } = useI18n()

const manager = useWidgetManager()
const store = manager.store

const draftModel = computed<WidgetConfig[]>({
  get: () => store.draft,
  set: (list) => store.setDraftOrder(list),
})

const settingsTarget = ref<WidgetConfig | null>(null)
const announcement = ref('')

function onDragEnd(event: { oldIndex?: number; newIndex?: number }): void {
  if (event.oldIndex === undefined || event.newIndex === undefined || event.oldIndex === event.newIndex)
    return
  const w = store.draft[event.newIndex]
  announcement.value = tt('{x} moved to position {n}', '「{x}」已移到第 {n} 個位置', {
    x: w ? widgetTitle(w) : 'Widget',
    n: event.newIndex + 1,
  })
}

function move(widget: WidgetConfig, direction: -1 | 1, index: number): void {
  store.moveWidget(widget.id, direction)
  announcement.value = tt('{x} moved to position {n}', '「{x}」已移到第 {n} 個位置', {
    x: widgetTitle(widget),
    n: index + direction + 1,
  })
}
</script>

<template>
  <div class="widget-grid-wrap">
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>

    <draggable
      v-if="store.editing"
      v-model="draftModel"
      item-key="id"
      class="widget-grid"
      handle=".widget__handle"
      ghost-class="widget-ghost"
      chosen-class="widget-chosen"
      :animation="180"
      :delay="200"
      :delay-on-touch-only="true"
      :force-fallback="false"
      data-testid="widget-grid"
      @end="onDragEnd"
    >
      <template #item="{ element, index }">
        <WidgetContainer
          :widget="element"
          :editing="true"
          :index="index"
          :count="store.draft.length"
          @remove="manager.removeWidget(element)"
          @toggle-visible="store.toggleVisibility(element.id)"
          @resize="(size) => manager.resize(element, size)"
          @move="(dir) => move(element, dir, index)"
          @settings="settingsTarget = element"
        >
          <WidgetRenderer :widget="element" />
        </WidgetContainer>
      </template>
    </draggable>

    <div v-else class="widget-grid" data-testid="widget-grid">
      <WidgetContainer
        v-for="(w, i) in store.displayedWidgets"
        :key="w.id"
        :widget="w"
        :editing="false"
        :index="i"
        :count="store.displayedWidgets.length"
        @hide="manager.hideWidget(w)"
      >
        <WidgetRenderer :widget="w" />
      </WidgetContainer>
    </div>

    <EmptyState
      v-if="!store.editing && store.displayedWidgets.length === 0"
      icon="layout"
      :title="tt('This dashboard is empty', '這個儀表板沒有 Widget')"
      :description="
        tt(
          'Switch to edit mode to add widgets or show hidden ones.',
          '進入編輯模式即可新增 Widget 或顯示已隱藏的 Widget。',
        )
      "
    >
      <BaseButton variant="primary" icon="edit" @click="manager.startEditing()">{{
        tt('Edit dashboard', '編輯儀表板')
      }}</BaseButton>
    </EmptyState>

    <WidgetSettingsModal :widget="settingsTarget" @close="settingsTarget = null" />
  </div>
</template>

<style scoped lang="scss">
// 12-column grid on desktop, 6 on tablet, 2 on mobile.
// Widget spans: sm 2 · md 4 · lg 8 · full 12 (desktop)
.widget-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: space(3);
  align-items: stretch;

  @include up('md') {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: space(4);
  }

  @include up('xl') {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: space(5);
  }

  // Mobile: KPI cards two per row, everything else full width.
  :deep(.widget) {
    grid-column: span 2;
  }

  :deep(.widget--sm) {
    grid-column: span 1;
  }

  @include up('md') {
    :deep(.widget--sm) {
      grid-column: span 2;
    }

    :deep(.widget--md) {
      grid-column: span 3;
    }

    :deep(.widget--lg),
    :deep(.widget--full) {
      grid-column: span 6;
    }
  }

  @include up('xl') {
    :deep(.widget--sm) {
      grid-column: span 2;
    }

    :deep(.widget--md) {
      grid-column: span 4;
    }

    :deep(.widget--lg) {
      grid-column: span 8;
    }

    :deep(.widget--full) {
      grid-column: span 12;
    }
  }
}

:deep(.widget-ghost) {
  opacity: 0.35;
  outline: 2px dashed var(--color-primary);
  outline-offset: -2px;
}

:deep(.widget-chosen) {
  box-shadow: var(--shadow-lg);
}
</style>
