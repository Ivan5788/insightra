<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DatePresetKey } from '~/types/analytics'

/**
 * Global date range picker.
 * Left: preset list (Today … Last month). Footer: custom range with native
 * date inputs (accessible + mobile-friendly pickers) and validation.
 * Writes to the filter store → every widget on the page updates.
 */
const { t, tt } = useI18n()
const date = useDateFilter()
const filters = useFilterStore()

const dropdown = ref<{ close: () => void } | null>(null)
const customFrom = ref(date.range.value.from)
const customTo = ref(date.range.value.to)
const error = ref<string | null>(null)

watch(date.range, (r) => {
  customFrom.value = r.from
  customTo.value = r.to
})

function pick(key: DatePresetKey): void {
  if (key === 'custom') return
  date.selectPreset(key)
  dropdown.value?.close()
}

function applyCustom(): void {
  error.value = null
  if (!customFrom.value || !customTo.value) {
    error.value = tt('Please choose both dates.', '請選擇開始與結束日期。')
    return
  }
  if (customFrom.value > customTo.value) {
    error.value = tt('"From" must be before "To".', '開始日期必須早於結束日期。')
    return
  }
  if (customFrom.value < date.minDate.value || customTo.value > date.maxDate.value) {
    error.value = tt('Dates must be within the available data window.', '日期必須在可用資料範圍內。')
    return
  }
  date.applyCustom({ from: customFrom.value, to: customTo.value })
  dropdown.value?.close()
}
</script>

<template>
  <BaseDropdown
    ref="dropdown"
    align="right"
    width="320px"
    :close-on-select="false"
    :label="tt('Date range', '日期區間')"
  >
    <template #trigger="{ toggle, attrs }">
      <button
        type="button"
        class="drp-trigger"
        v-bind="attrs"
        data-testid="date-range-trigger"
        @click="toggle"
      >
        <AppIcon name="calendar" :size="16" />
        <span class="drp-trigger__text">
          <span class="drp-trigger__preset">{{ date.presetLabel.value }}</span>
          <span class="drp-trigger__range">{{ date.rangeLabel.value }}</span>
        </span>
        <AppIcon name="chevron-down" :size="16" />
      </button>
    </template>

    <div class="drp">
      <ul class="drp__presets" role="listbox" :aria-label="tt('Date presets', '快速選擇')">
        <li v-for="p in date.presets.filter((x) => x.key !== 'custom')" :key="p.key">
          <button
            type="button"
            role="option"
            class="dropdown-item"
            :class="{ 'is-active': date.preset.value === p.key }"
            :aria-selected="date.preset.value === p.key"
            :data-testid="'preset-' + p.key"
            @click="pick(p.key)"
          >
            <span class="drp__check"
              ><AppIcon v-if="date.preset.value === p.key" name="check" :size="16"
            /></span>
            {{ p.label }}
          </button>
        </li>
      </ul>

      <form class="drp__custom" @submit.prevent="applyCustom">
        <p class="dropdown-label">{{ tt('Custom range', '自訂區間') }}</p>
        <div class="drp__inputs">
          <label class="field">
            <span class="field__label">{{ t('filter.from') }}</span>
            <input
              v-model="customFrom"
              type="date"
              class="input"
              :min="date.minDate.value"
              :max="date.maxDate.value"
            />
          </label>
          <label class="field">
            <span class="field__label">{{ t('filter.to') }}</span>
            <input
              v-model="customTo"
              type="date"
              class="input"
              :min="date.minDate.value"
              :max="date.maxDate.value"
            />
          </label>
        </div>
        <p v-if="error" class="field__error" role="alert">{{ error }}</p>
        <BaseButton type="submit" variant="primary" size="sm" block>{{ t('filter.apply') }}</BaseButton>
      </form>

      <div class="drp__compare">
        <ToggleSwitch
          :model-value="filters.compare"
          :label="tt('Compare with previous period', '與前期比較')"
          :description="t('filter.compareTo') + ': ' + date.comparisonLabel.value"
          @update:model-value="filters.setCompare"
        />
      </div>
    </div>
  </BaseDropdown>
</template>

<style scoped lang="scss">
.drp-trigger {
  @include reset-button;
  display: inline-flex;
  align-items: center;
  gap: space(2);
  min-height: 38px;
  padding: space(1) space(3);
  border: 1px solid var(--color-border-strong);
  border-radius: $radius-md;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  text-align: left;
  @include focus-ring;

  &:hover {
    border-color: var(--color-text-muted);
  }

  &__text {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  &__preset {
    font-size: fs('xs');
    color: var(--color-text-muted);
  }

  &__range {
    font-size: fs('sm');
    font-weight: $font-weight-semibold;
    color: var(--color-text);
    white-space: nowrap;
  }
}

.drp {
  &__presets {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__check {
    display: inline-grid;
    place-items: center;
    width: 16px;
  }

  &__custom {
    display: grid;
    gap: space(2);
    margin-top: space(1.5);
    padding: space(2) space(2.5);
    border-top: 1px solid var(--color-border);
  }

  &__inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: space(2);

    .input {
      min-height: 34px;
      padding: 0 space(2);
      font-size: fs('sm');
    }
  }

  &__compare {
    padding: space(3) space(2.5) space(1.5);
    border-top: 1px solid var(--color-border);
    font-size: fs('sm');
  }
}
</style>
