<script setup lang="ts">
import { computed } from 'vue'
import { channelLabel } from '~/data/catalog'
import type { WidgetConfig } from '~/types/widgets'
import { widgetTitle } from '~/data/widget-registry'
import { formatHour, formatShortDate } from '~/utils/date'
import { formatCurrency } from '~/utils/format'

const { tt } = useI18n()

const props = defineProps<{ widget: WidgetConfig }>()
const limit = computed(() => props.widget.settings.limit ?? 6)
const orders = useRecentOrders(() => limit.value)
</script>

<template>
  <div v-if="orders.pending.value && !orders.data.value" class="tw-skel">
    <SkeletonBlock v-for="i in limit" :key="i" height="32px" />
  </div>
  <ErrorState
    v-else-if="orders.error.value"
    compact
    :message="orders.error.value.message"
    @retry="orders.refresh()"
  />
  <EmptyState
    v-else-if="!orders.data.value?.items.length"
    compact
    :title="tt('No transactions in this period', '此期間沒有交易')"
  />
  <div v-else class="tw">
    <div class="tw__scroll">
      <table class="tw__table">
        <caption class="sr-only">
          {{
            widgetTitle(widget)
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ tt('Order', '訂單') }}</th>
            <th scope="col">{{ tt('Customer', '顧客') }}</th>
            <th scope="col" class="hide-mobile">{{ tt('Channel', '渠道') }}</th>
            <th scope="col" class="hide-mobile">{{ tt('Date', '日期') }}</th>
            <th scope="col">{{ tt('Status', '狀態') }}</th>
            <th scope="col" class="num">{{ tt('Amount', '金額') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders.data.value.items" :key="o.id">
            <td class="tw__id">{{ o.id }}</td>
            <td>{{ o.customerName }}</td>
            <td class="hide-mobile">{{ channelLabel(o.channel) }}</td>
            <td class="hide-mobile">{{ formatShortDate(o.date) }} {{ formatHour(o.hour) }}</td>
            <td><StatusBadge :status="o.status" /></td>
            <td class="num">{{ formatCurrency(o.total) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <NuxtLink to="/data" class="tw__all">{{
      tt('View all {n} orders →', '查看全部 {n} 筆訂單 →', {
        n: orders.data.value.total.toLocaleString('en-US'),
      })
    }}</NuxtLink>
  </div>
</template>

<style scoped lang="scss">
.tw-skel {
  display: grid;
  gap: space(2);
}

.tw {
  &__scroll {
    overflow-x: auto;
    @include scrollbar-thin;
  }

  &__table {
    font-size: fs('sm');

    th,
    td {
      padding: space(2.5) space(2);
      border-bottom: 1px solid var(--color-border);
      text-align: left;
      white-space: nowrap;
    }

    th {
      font-size: fs('xs');
      font-weight: $font-weight-semibold;
      color: var(--color-text-muted);
    }

    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: $font-weight-semibold;
    }
  }

  &__id {
    font-family: $font-mono;
    font-size: fs('xs');
    color: var(--color-text-secondary);
  }

  &__all {
    display: inline-block;
    margin-top: space(3);
    font-size: fs('sm');
    font-weight: $font-weight-medium;
  }
}
</style>
