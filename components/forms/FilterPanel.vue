<script setup lang="ts">
import { ref, watch } from 'vue'
import { CATEGORIES, CHANNELS, REGIONS, categoryLabel, channelLabel, regionLabel } from '~/data/catalog'
import type { CategoryId, ChannelId, RegionId } from '~/types/domain'

/**
 * Segment filters (channel / category / region).
 * Edits a local draft and applies on "Apply" — one data refresh instead of
 * three while the user is still choosing.
 */
const { t, tt } = useI18n()
const filters = useFilterStore()

const dropdown = ref<{ close: () => void } | null>(null)
const channel = ref<ChannelId | ''>(filters.channel ?? '')
const category = ref<CategoryId | ''>(filters.category ?? '')
const region = ref<RegionId | ''>(filters.region ?? '')

watch(
  () => [filters.channel, filters.category, filters.region],
  () => {
    channel.value = filters.channel ?? ''
    category.value = filters.category ?? ''
    region.value = filters.region ?? ''
  },
)

const channelOptions = CHANNELS.map((c) => ({ value: c.id, label: channelLabel(c.id) }))
const categoryOptions = CATEGORIES.map((c) => ({ value: c.id, label: categoryLabel(c.id) }))
const regionOptions = REGIONS.map((r) => ({ value: r.id, label: regionLabel(r.id) }))

function apply(): void {
  filters.setSegments({
    channel: channel.value || undefined,
    category: category.value || undefined,
    region: region.value || undefined,
  })
  dropdown.value?.close()
}

function clear(): void {
  filters.clearSegments()
  dropdown.value?.close()
}
</script>

<template>
  <BaseDropdown
    ref="dropdown"
    align="right"
    width="300px"
    :close-on-select="false"
    :label="t('filter.filters')"
  >
    <template #trigger="{ toggle, attrs }">
      <button
        type="button"
        class="filter-trigger"
        v-bind="attrs"
        data-testid="filter-trigger"
        @click="toggle"
      >
        <AppIcon name="filter" :size="16" />
        <span>{{ t('filter.filters') }}</span>
        <span v-if="filters.activeSegmentCount" class="filter-trigger__count">{{
          filters.activeSegmentCount
        }}</span>
      </button>
    </template>

    <form class="filter-panel" @submit.prevent="apply">
      <SelectInput
        v-model="channel"
        :label="t('filter.channel')"
        :placeholder="t('filter.all')"
        :options="channelOptions"
      />
      <SelectInput
        v-model="category"
        :label="t('filter.category')"
        :placeholder="t('filter.all')"
        :options="categoryOptions"
      />
      <SelectInput
        v-model="region"
        :label="t('filter.region')"
        :placeholder="t('filter.all')"
        :options="regionOptions"
      />
      <p class="filter-panel__note">
        {{
          tt(
            'Traffic metrics (sessions, conversion) are tracked per channel only and show "—" when a category or region filter is active.',
            '流量指標（工作階段、轉換率）只依渠道追蹤；套用品類或地區篩選時會顯示「—」。',
          )
        }}
      </p>
      <div class="filter-panel__actions">
        <BaseButton size="sm" variant="ghost" @click="clear">{{ t('filter.clear') }}</BaseButton>
        <BaseButton size="sm" variant="primary" type="submit" data-testid="filter-apply">{{
          t('filter.apply')
        }}</BaseButton>
      </div>
    </form>
  </BaseDropdown>
</template>

<style scoped lang="scss">
.filter-trigger {
  @include reset-button;
  display: inline-flex;
  align-items: center;
  gap: space(2);
  min-height: 38px;
  padding: 0 space(3);
  border: 1px solid var(--color-border-strong);
  border-radius: $radius-md;
  background: var(--color-surface);
  font-weight: $font-weight-medium;
  color: var(--color-text);
  @include focus-ring;

  &:hover {
    border-color: var(--color-text-muted);
  }

  &__count {
    min-width: 20px;
    padding: 0 6px;
    border-radius: $radius-full;
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-size: fs('xs');
    line-height: 20px;
    text-align: center;
  }
}

.filter-panel {
  display: grid;
  gap: space(3);
  padding: space(2);

  &__note {
    font-size: fs('xs');
    color: var(--color-text-muted);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: space(2);
  }
}
</style>
