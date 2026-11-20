<script setup lang="ts">
/**
 * Maps a widget `type` to its component.
 * defineAsyncComponent → every widget type is its own JS chunk, loaded
 * only when a dashboard actually contains that widget (code splitting).
 */
import { defineAsyncComponent, type Component } from 'vue'
import type { WidgetConfig, WidgetType } from '~/types/widgets'

defineProps<{ widget: WidgetConfig }>()

const COMPONENTS: Record<WidgetType, Component> = {
  kpi: defineAsyncComponent(() => import('./KpiWidget.vue')),
  line: defineAsyncComponent(() => import('./LineChartWidget.vue')),
  bar: defineAsyncComponent(() => import('./BarChartWidget.vue')),
  area: defineAsyncComponent(() => import('./AreaChartWidget.vue')),
  donut: defineAsyncComponent(() => import('./DonutChartWidget.vue')),
  table: defineAsyncComponent(() => import('./TableWidget.vue')),
  ranking: defineAsyncComponent(() => import('./RankingWidget.vue')),
  activity: defineAsyncComponent(() => import('./ActivityWidget.vue')),
}
</script>

<template>
  <component :is="COMPONENTS[widget.type]" :widget="widget" />
</template>
