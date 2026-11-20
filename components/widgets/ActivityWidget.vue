<script setup lang="ts">
import { computed } from 'vue'
import type { WidgetConfig } from '~/types/widgets'

const { tt } = useI18n()

const props = defineProps<{ widget: WidgetConfig }>()
const limit = computed(() => props.widget.settings.limit ?? 6)
const activity = useActivity(() => limit.value)
</script>

<template>
  <div v-if="activity.pending.value && !activity.data.value" class="act-skel">
    <SkeletonBlock v-for="i in limit" :key="i" height="36px" />
  </div>
  <ErrorState
    v-else-if="activity.error.value"
    compact
    :message="activity.error.value.message"
    @retry="activity.refresh()"
  />
  <EmptyState
    v-else-if="!activity.data.value?.length"
    compact
    :title="tt('No recent activity', '沒有最近動態')"
  />
  <ActivityFeed v-else :items="activity.data.value" />
</template>

<style scoped lang="scss">
.act-skel {
  display: grid;
  gap: space(3);
}
</style>
