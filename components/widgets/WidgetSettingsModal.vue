<script setup lang="ts">
/**
 * Edit one widget's configuration (title, metric, dimension, item count, size).
 * Works on a local copy; "Apply" writes it into the dashboard draft.
 */
import { computed, ref, watch } from 'vue'
import { WIDGET_REGISTRY, dimensionLabel, widgetDescription, widgetTitle } from '~/data/widget-registry'
import type { DimensionKey, MetricKey } from '~/types/analytics'
import type { WidgetConfig, WidgetSize } from '~/types/widgets'
import { metricInfo } from '~/utils/metrics'

const { tt } = useI18n()

const props = defineProps<{ widget: WidgetConfig | null }>()
const emit = defineEmits<{ close: [] }>()
const store = useDashboardStore()

const title = ref('')
const metric = ref<MetricKey | ''>('')
const dimension = ref<DimensionKey | ''>('')
const limit = ref(5)
const size = ref<WidgetSize>('md')

watch(
  () => props.widget,
  (w) => {
    if (!w) return
    title.value = w.title
    metric.value = (w.settings.metric as MetricKey | undefined) ?? ''
    dimension.value = w.settings.dimension ?? ''
    limit.value = w.settings.limit ?? 5
    size.value = w.size
  },
  { immediate: true },
)

const def = computed(() => (props.widget ? WIDGET_REGISTRY[props.widget.type] : null))
const SIZE_LABEL: Record<WidgetSize, string> = {
  sm: tt('Small', '小'),
  md: tt('Medium', '中'),
  lg: tt('Large', '大'),
  full: tt('Full width', '滿版'),
}

const metricOptions = computed(() =>
  (def.value?.metricOptions ?? []).map((m) => ({ value: m, label: metricInfo(m).label })),
)
const dimensionOptions = computed(() =>
  (def.value?.dimensionOptions ?? []).map((d) => ({ value: d, label: dimensionLabel(d) })),
)
const sizeOptions = computed(() =>
  (def.value?.allowedSizes ?? []).map((s) => ({ value: s, label: SIZE_LABEL[s] })),
)
const timeBased = computed(() => props.widget?.type === 'bar' || props.widget?.type === 'area')

function apply(): void {
  if (!props.widget) return
  store.updateWidget(props.widget.id, {
    title: title.value.trim(),
    size: size.value,
    settings: {
      metric: metric.value || undefined,
      dimension: dimension.value || undefined,
      limit: def.value!.editable.includes('limit')
        ? Math.min(20, Math.max(1, Number(limit.value)))
        : undefined,
    },
  })
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="!!widget"
    :title="tt('Widget settings', 'Widget 設定')"
    :description="widget ? widgetDescription(widget.type) : undefined"
    @close="emit('close')"
  >
    <form v-if="widget && def" id="widget-settings" class="ws-form" @submit.prevent="apply">
      <div class="field">
        <label for="ws-title" class="field__label">{{ tt('Title', '標題') }}</label>
        <input
          id="ws-title"
          v-model="title"
          class="input"
          maxlength="80"
          :placeholder="widget ? widgetTitle({ ...widget, title: '' }) : ''"
        />
      </div>
      <SelectInput
        v-if="def.editable.includes('metric')"
        v-model="metric"
        :label="tt('Metric', '指標')"
        :options="metricOptions"
      />
      <SelectInput
        v-if="def.editable.includes('dimension')"
        v-model="dimension"
        :label="tt('Group by', '分組依據')"
        :options="dimensionOptions"
        :placeholder="timeBased ? tt('Time (date)', '時間（日期）') : undefined"
      />
      <div v-if="def.editable.includes('limit')" class="field">
        <label for="ws-limit" class="field__label">{{ tt('Number of items', '顯示筆數') }}</label>
        <input id="ws-limit" v-model.number="limit" type="number" min="1" max="20" class="input" />
      </div>
      <SelectInput
        v-if="sizeOptions.length > 1"
        v-model="size"
        :label="tt('Size', '尺寸')"
        :options="sizeOptions"
      />
    </form>
    <template #footer>
      <BaseButton @click="emit('close')">{{ tt('Cancel', '取消') }}</BaseButton>
      <BaseButton variant="primary" type="submit" form="widget-settings">{{
        tt('Apply', '套用')
      }}</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped lang="scss">
.ws-form {
  display: grid;
  gap: space(4);
}
</style>
