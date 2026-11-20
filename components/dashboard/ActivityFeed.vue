<script setup lang="ts">
import type { IconName } from '~/data/icons'
import type { ActivityItem } from '~/types/analytics'
import { formatHour, formatShortDate } from '~/utils/date'
import { formatCurrency } from '~/utils/format'

defineProps<{ items: ActivityItem[] }>()

const ICON: Record<ActivityItem['type'], { icon: IconName; tone: string }> = {
  order: { icon: 'cart', tone: 'success' },
  refund: { icon: 'arrow-left', tone: 'warning' },
  signup: { icon: 'user', tone: 'primary' },
  milestone: { icon: 'trophy', tone: 'info' },
  report: { icon: 'file-text', tone: 'info' },
}
</script>

<template>
  <ol class="activity" role="list">
    <li v-for="item in items" :key="item.id" class="activity__item">
      <span class="activity__icon" :class="'activity__icon--' + ICON[item.type].tone">
        <AppIcon :name="ICON[item.type].icon" :size="15" />
      </span>
      <div class="activity__body">
        <p class="activity__title">
          {{ item.title }}
          <b v-if="item.amount" class="activity__amount">{{ formatCurrency(item.amount) }}</b>
        </p>
        <p class="activity__desc">{{ item.description }}</p>
      </div>
      <time class="activity__time" :datetime="item.date"
        >{{ formatShortDate(item.date) }}<br />{{ formatHour(item.hour) }}</time
      >
    </li>
  </ol>
</template>

<style scoped lang="scss">
.activity {
  display: grid;
  margin: 0;
  padding: 0;

  &__item {
    display: flex;
    align-items: flex-start;
    gap: space(3);
    padding: space(2.5) 0;
    border-bottom: 1px solid var(--color-border);

    &:last-child {
      border-bottom: 0;
    }
  }

  &__icon {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: $radius-full;

    &--success {
      background: var(--color-success-soft);
      color: var(--color-success);
    }

    &--warning {
      background: var(--color-warning-soft);
      color: var(--color-warning);
    }

    &--primary {
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }

    &--info {
      background: var(--color-info-soft);
      color: var(--color-info);
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: flex;
    justify-content: space-between;
    gap: space(2);
    font-weight: $font-weight-medium;
    font-size: fs('sm');
  }

  &__amount {
    font-variant-numeric: tabular-nums;
  }

  &__desc {
    font-size: fs('xs');
    color: var(--color-text-muted);
    @include truncate;
  }

  &__time {
    flex-shrink: 0;
    font-size: 11px;
    line-height: 1.4;
    text-align: right;
    color: var(--color-text-muted);
  }
}
</style>
