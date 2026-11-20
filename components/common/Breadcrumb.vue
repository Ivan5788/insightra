<script setup lang="ts">
const { tt } = useI18n()
/**
 * Breadcrumb navigation. Items with `to` are links; items with only
 * `index` emit `navigate` (used by the drill-down panel). The last item
 * is the current location (aria-current="page").
 */
defineProps<{ items: { label: string; to?: string }[]; label?: string }>()
const emit = defineEmits<{ navigate: [index: number] }>()
</script>

<template>
  <nav class="breadcrumb" :aria-label="label ?? tt('Breadcrumb', '麵包屑')">
    <ol class="breadcrumb__list">
      <li v-for="(item, i) in items" :key="i" class="breadcrumb__item">
        <span v-if="i === items.length - 1" class="breadcrumb__current" aria-current="page">{{
          item.label
        }}</span>
        <NuxtLink v-else-if="item.to" :to="item.to" class="breadcrumb__link">{{ item.label }}</NuxtLink>
        <button v-else type="button" class="breadcrumb__link breadcrumb__btn" @click="emit('navigate', i)">
          {{ item.label }}
        </button>
        <AppIcon v-if="i < items.length - 1" name="chevron-right" :size="14" class="breadcrumb__sep" />
      </li>
    </ol>
  </nav>
</template>

<style scoped lang="scss">
.breadcrumb {
  &__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: space(1);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: fs('sm');
  }

  &__item {
    display: inline-flex;
    align-items: center;
    gap: space(1);
    min-width: 0;
  }

  &__link {
    color: var(--color-text-muted);
    border-radius: $radius-sm;
    @include focus-ring(1px);

    &:hover {
      color: var(--color-primary);
      text-decoration: none;
    }
  }

  &__btn {
    @include reset-button;
    padding: 2px 4px;
    margin: 0 -4px;
  }

  &__current {
    font-weight: $font-weight-semibold;
    color: var(--color-text);
    @include truncate;
    max-width: 260px;
  }

  &__sep {
    color: var(--color-text-muted);
    opacity: 0.6;
  }
}
</style>
