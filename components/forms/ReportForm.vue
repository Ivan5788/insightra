<script setup lang="ts">
/**
 * Create-report form (inside a modal). Client-side validation with clear
 * per-field messages; emits a fully typed NewReport on submit.
 */
import { reactive, ref } from 'vue'
import {
  REPORT_GRANULARITIES,
  REPORT_METRICS,
  REPORT_PRESETS,
  REPORT_SCHEDULES,
  REPORT_TYPES,
} from '~/data/report-options'
import type { NewReport } from '~/services/reports.service'
import type { MetricKey } from '~/types/analytics'
import { addDays, todayISO } from '~/utils/date'
import { metricInfo } from '~/utils/metrics'

const { tt } = useI18n()

defineProps<{ submitting?: boolean }>()
const emit = defineEmits<{ submit: [report: NewReport]; cancel: [] }>()

const today = todayISO()
const form = reactive<NewReport>({
  name: '',
  description: '',
  type: 'sales',
  metrics: ['revenue', 'orders'],
  preset: 'last30',
  customRange: { from: addDays(today, -29), to: today },
  granularity: 'day',
  schedule: 'none',
})
const errors = ref<Partial<Record<'name' | 'metrics' | 'range', string>>>({})

function toggleMetric(m: MetricKey): void {
  form.metrics = form.metrics.includes(m) ? form.metrics.filter((x) => x !== m) : [...form.metrics, m]
}

function submit(): void {
  errors.value = {}
  if (!form.name.trim()) errors.value.name = tt('Please give the report a name.', '請輸入報表名稱。')
  if (form.metrics.length === 0)
    errors.value.metrics = tt('Select at least one metric.', '請至少選擇一個指標。')
  if (form.preset === 'custom' && (!form.customRange || form.customRange.from > form.customRange.to)) {
    errors.value.range = tt('"From" must be before "To".', '「開始日期」必須早於「結束日期」。')
  }
  if (Object.keys(errors.value).length) return
  emit('submit', {
    ...form,
    name: form.name.trim(),
    description: form.description.trim(),
    customRange: form.preset === 'custom' ? form.customRange : undefined,
  })
}
</script>

<template>
  <form id="report-form" class="report-form" novalidate @submit.prevent="submit">
    <div class="field">
      <label for="rf-name" class="field__label">{{ tt('Report name', '報表名稱') }} *</label>
      <input
        id="rf-name"
        v-model="form.name"
        class="input"
        maxlength="80"
        :placeholder="tt('e.g. Q4 Holiday Sales', '例如：第四季節慶檔期銷售')"
        :aria-invalid="!!errors.name"
        aria-describedby="rf-name-err"
        autofocus
      />
      <p v-if="errors.name" id="rf-name-err" class="field__error">{{ errors.name }}</p>
    </div>

    <div class="field">
      <label for="rf-desc" class="field__label">{{ tt('Description', '說明') }}</label>
      <textarea id="rf-desc" v-model="form.description" class="input" maxlength="300" rows="2" />
    </div>

    <div class="report-form__row">
      <SelectInput v-model="form.type" :label="tt('Type', '類型')" :options="REPORT_TYPES" />
      <SelectInput v-model="form.schedule" :label="tt('Schedule', '排程')" :options="REPORT_SCHEDULES" />
    </div>

    <fieldset class="report-form__metrics">
      <legend class="field__label">{{ tt('Metrics', '指標') }} *</legend>
      <div class="report-form__checks">
        <label v-for="m in REPORT_METRICS" :key="m" class="report-form__check">
          <input
            type="checkbox"
            class="checkbox"
            :checked="form.metrics.includes(m)"
            @change="toggleMetric(m)"
          />
          {{ metricInfo(m).label }}
        </label>
      </div>
      <p v-if="errors.metrics" class="field__error">{{ errors.metrics }}</p>
    </fieldset>

    <div class="report-form__row">
      <SelectInput v-model="form.preset" :label="tt('Date range', '日期範圍')" :options="REPORT_PRESETS" />
      <SelectInput
        v-model="form.granularity"
        :label="tt('Granularity', '時間粒度')"
        :options="REPORT_GRANULARITIES"
      />
    </div>

    <div v-if="form.preset === 'custom' && form.customRange" class="report-form__row">
      <label class="field">
        <span class="field__label">{{ tt('From', '開始日期') }}</span>
        <input v-model="form.customRange.from" type="date" class="input" :max="today" />
      </label>
      <label class="field">
        <span class="field__label">{{ tt('To', '結束日期') }}</span>
        <input v-model="form.customRange.to" type="date" class="input" :max="today" />
      </label>
      <p v-if="errors.range" class="field__error">{{ errors.range }}</p>
    </div>
  </form>
</template>

<style scoped lang="scss">
.report-form {
  display: grid;
  gap: space(4);

  &__row {
    display: grid;
    gap: space(3);

    @include up('sm') {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__metrics {
    margin: 0;
    padding: 0;
    border: 0;
  }

  &__checks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: space(2);
    margin-top: space(2);
  }

  &__check {
    display: flex;
    align-items: center;
    gap: space(2);
    font-size: fs('sm');
    cursor: pointer;
  }
}
</style>
