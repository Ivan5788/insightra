<script setup lang="ts">
import type { IconName } from '~/data/icons'

const { tt } = useI18n()

withDefaults(defineProps<{ title?: string; description?: string; icon?: IconName; compact?: boolean }>(), {
  icon: 'database',
})
</script>

<template>
  <div class="empty-state" :class="{ 'empty-state--compact': compact }">
    <span class="empty-state__icon"><AppIcon :name="icon" :size="compact ? 20 : 24" /></span>
    <p class="empty-state__title">{{ title ?? tt('No data', '沒有資料') }}</p>
    <p v-if="description" class="empty-state__desc">{{ description }}</p>
    <div v-if="$slots.default" class="empty-state__actions"><slot /></div>
  </div>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: space(1.5);
  padding: space(10) space(4);
  text-align: center;
  color: var(--color-text-secondary);

  &--compact {
    padding: space(6) space(3);
  }

  &__icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: $radius-full;
    background: var(--color-surface-2);
    color: var(--color-text-muted);
    margin-bottom: space(1);
  }

  &__title {
    font-weight: $font-weight-semibold;
    color: var(--color-text);
  }

  &__desc {
    max-width: 320px;
    font-size: fs('sm');
    color: var(--color-text-muted);
  }

  &__actions {
    margin-top: space(2);
  }
}
</style>
