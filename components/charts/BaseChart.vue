<script setup lang="ts">
/**
 * BaseChart — the ONLY component that talks to ECharts directly.
 *
 * Lifecycle:
 *   onMounted     → echarts.init() on the <div>
 *   watch(option) → chart.setOption()  (data, theme or size changed)
 *   ResizeObserver→ chart.resize()     (widget resized, sidebar collapsed…)
 *   onUnmounted   → chart.dispose()    (avoid memory leaks)
 *
 * ECharts draws on <canvas> and needs `window`, so charts only run in the
 * browser. This app is a SPA (ssr: false); in an SSR app you would wrap this
 * component in <ClientOnly>. It is always used as <LazyBaseChart> so the
 * ECharts bundle is code-split and loaded on demand.
 */
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import type { EChartsOption } from 'echarts'
import type { ChartClickEvent } from '~/types/charts'
import { echarts, type ECharts } from '~/utils/charts/echarts'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: number | string
    /** Text alternative for screen readers. */
    label: string
    clickable?: boolean
  }>(),
  { height: 300 },
)

const emit = defineEmits<{
  click: [event: ChartClickEvent]
  datazoom: [event: { start?: number; end?: number }]
  legendselectchanged: [selected: Record<string, boolean>]
}>()

const el = ref<HTMLDivElement | null>(null)
const chart = shallowRef<ECharts | null>(null)
let observer: ResizeObserver | null = null
let frame = 0

onMounted(() => {
  if (!el.value) return
  chart.value = echarts.init(el.value, undefined, { renderer: 'canvas' })
  chart.value.setOption(props.option)

  chart.value.on('click', (p) => {
    const params = p as unknown as ChartClickEvent
    emit('click', {
      name: params.name,
      dataIndex: params.dataIndex,
      seriesName: params.seriesName,
      value: params.value,
    })
  })
  chart.value.on('datazoom', (p) => {
    const params = p as unknown as { start?: number; end?: number; batch?: { start: number; end: number }[] }
    emit('datazoom', params.batch?.[0] ?? { start: params.start, end: params.end })
  })
  chart.value.on('legendselectchanged', (p) => {
    emit('legendselectchanged', (p as unknown as { selected: Record<string, boolean> }).selected)
  })

  // Resize when the CONTAINER changes size (not only the window).
  observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => chart.value?.resize())
  })
  observer.observe(el.value)
})

// notMerge: replace the whole option so removed series / theme colours don't linger.
watch(
  () => props.option,
  (option) => chart.value?.setOption(option, { notMerge: true }),
)

onBeforeUnmount(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
  chart.value?.dispose()
  chart.value = null
})

defineExpose({ getInstance: () => chart.value })
</script>

<template>
  <div
    ref="el"
    class="base-chart"
    :class="{ 'base-chart--clickable': clickable }"
    :style="{ height: typeof height === 'number' ? height + 'px' : height }"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  />
</template>

<style scoped lang="scss">
.base-chart {
  width: 100%;
  min-width: 0;

  &--clickable {
    cursor: pointer;
  }
}
</style>
