<script setup lang="ts">
import { computed } from 'vue'
import { categoryLabel, channelLabel, regionLabel } from '~/data/catalog'

/**
 * Date picker + segment filters + removable chips showing what is active.
 * Placed in the header of every analytics page so filters are always visible.
 */
withDefaults(defineProps<{ showSegments?: boolean }>(), { showSegments: true })

const filters = useFilterStore()
const { t, tt } = useI18n()

const chips = computed(() => {
  const list: { key: 'channel' | 'category' | 'region'; label: string }[] = []
  if (filters.channel)
    list.push({ key: 'channel', label: t('filter.channel') + '：' + channelLabel(filters.channel) })
  if (filters.category)
    list.push({ key: 'category', label: t('filter.category') + '：' + categoryLabel(filters.category) })
  if (filters.region)
    list.push({ key: 'region', label: t('filter.region') + '：' + regionLabel(filters.region) })
  return list
})

function remove(key: 'channel' | 'category' | 'region'): void {
  filters.setSegments({
    channel: key === 'channel' ? undefined : filters.channel,
    category: key === 'category' ? undefined : filters.category,
    region: key === 'region' ? undefined : filters.region,
  })
}
</script>

<template>
  <div class="gfb">
    <div class="gfb__controls">
      <FilterPanel v-if="showSegments" />
      <DateRangePicker />
    </div>
    <ul
      v-if="showSegments && chips.length"
      class="gfb__chips"
      role="list"
      :aria-label="tt('Active filters', '目前篩選')"
    >
      <li v-for="chip in chips" :key="chip.key" class="gfb__chip">
        {{ chip.label }}
        <button
          type="button"
          :aria-label="tt('Remove filter {x}', '移除篩選 {x}', { x: chip.label })"
          @click="remove(chip.key)"
        >
          <AppIcon name="x" :size="12" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.gfb {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: space(2);

  @include down('md') {
    width: 100%;
    align-items: stretch;
  }

  &__controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: space(2);

    @include down('md') {
      justify-content: flex-start;
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: space(1.5);
    margin: 0;
    padding: 0;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: space(1);
    padding: 2px space(1) 2px space(2.5);
    border-radius: $radius-full;
    background: var(--color-primary-soft);
    color: var(--color-primary-soft-text);
    font-size: fs('xs');
    font-weight: $font-weight-medium;

    button {
      @include reset-button;
      display: grid;
      place-items: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      @include focus-ring(0);

      &:hover {
        background: rgb(0 0 0 / 0.08);
      }
    }
  }
}
</style>
