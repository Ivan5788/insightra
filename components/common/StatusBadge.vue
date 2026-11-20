<script setup lang="ts">
import { computed } from 'vue'
import type { OrderStatus } from '~/types/domain'
import type { IconName } from '~/data/icons'

const { tt } = useI18n()

const props = defineProps<{ status: OrderStatus | string }>()

const MAP: Record<string, { tone: string; label: string; icon: IconName }> = {
  completed: { tone: 'success', label: tt('Completed', '已完成'), icon: 'check' },
  pending: { tone: 'info', label: tt('Pending', '處理中'), icon: 'refresh' },
  refunded: { tone: 'warning', label: tt('Refunded', '已退款'), icon: 'arrow-left' },
  cancelled: { tone: 'danger', label: tt('Cancelled', '已取消'), icon: 'x' },
}

const meta = computed(() => MAP[props.status] ?? { tone: '', label: props.status, icon: 'info' as IconName })
</script>

<template>
  <span class="badge" :class="meta.tone && 'badge--' + meta.tone">
    <AppIcon :name="meta.icon" :size="12" />
    {{ meta.label }}
  </span>
</template>
