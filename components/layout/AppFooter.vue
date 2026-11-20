<script setup lang="ts">
const { tt } = useI18n()
const config = useRuntimeConfig()
</script>

<template>
  <footer class="app-footer">
    <span
      >© 2026 Insightra v{{ config.public.appVersion }} · {{ tt('Portfolio project', '作品集專案') }}</span
    >
    <span>{{
      tt(
        'Data source: mock REST API (simulated, not real business data)',
        '資料來源：Mock REST API（模擬資料，非真實商業數據）',
      )
    }}</span>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: space(1) space(4);
  padding: space(4);
  border-top: 1px solid var(--color-border);
  font-size: fs('xs');
  color: var(--color-text-muted);

  @include up('md') {
    padding: space(4) space(6);
  }

  @include up('xl') {
    padding: space(4) space(8);
  }
}
</style>
