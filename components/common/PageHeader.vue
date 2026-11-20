<script setup lang="ts">
/**
 * Page title block (a.k.a. PageTitle): breadcrumb, H1, subtitle and an
 * actions slot. Also sets the browser tab title.
 */
const props = defineProps<{
  title: string
  subtitle?: string
  breadcrumb?: { label: string; to?: string }[]
}>()

useHead(() => ({ title: props.title + ' · Insightra' }))
</script>

<template>
  <header class="page-header">
    <div class="page-header__main">
      <Breadcrumb v-if="breadcrumb?.length" :items="breadcrumb" class="page-header__crumbs" />
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: space(3) space(4);

  &__main {
    min-width: 0;
  }

  &__crumbs {
    margin-bottom: space(1.5);
  }

  &__title {
    font-size: fs('xl');
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
    line-height: 1.25;

    @include up('md') {
      font-size: fs('2xl');
    }
  }

  &__subtitle {
    margin-top: space(1);
    color: var(--color-text-muted);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(2);
  }
}
</style>
