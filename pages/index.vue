<script setup lang="ts">
/**
 * Dashboard Overview — personalised widget dashboard.
 * Everything below reads the global filter, so changing the date range
 * updates every KPI, chart, ranking and table on this page at once.
 */
const { t, tt } = useI18n()
const store = useDashboardStore()
useDashboard()

onBeforeRouteLeave(async () => {
  if (!store.isDirty) {
    store.cancelEditing()
    return true
  }
  const ok = await useUiStore().confirm({
    title: tt('Leave without saving?', '不儲存就離開？'),
    message: tt('You have unsaved dashboard changes.', '儀表板有尚未儲存的變更。'),
    confirmLabel: tt('Leave', '離開'),
    danger: true,
  })
  if (ok) store.cancelEditing()
  return ok
})
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.overview.title')" :subtitle="t('page.overview.subtitle')">
      <template #actions>
        <GlobalFilterBar />
      </template>
    </PageHeader>

    <div class="overview-bar">
      <DashboardToolbar />
      <p v-if="store.editing" class="overview-bar__hint" role="status">
        <AppIcon name="info" :size="16" /> {{ t('dashboard.editing') }}
      </p>
    </div>

    <WidgetGrid />
  </div>
</template>

<style scoped lang="scss">
.overview-bar {
  display: flex;
  flex-direction: column;
  gap: space(3);

  &__hint {
    display: flex;
    align-items: center;
    gap: space(2);
    padding: space(2.5) space(3);
    border-radius: $radius-md;
    background: var(--color-info-soft);
    color: var(--color-info);
    font-size: fs('sm');
  }
}
</style>
