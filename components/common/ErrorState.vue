<script setup lang="ts">
const { tt } = useI18n()
defineProps<{ title?: string; message?: string; compact?: boolean }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error-state" :class="{ 'error-state--compact': compact }" role="alert">
    <span class="error-state__icon"><AppIcon name="alert-triangle" :size="compact ? 20 : 24" /></span>
    <p class="error-state__title">{{ title ?? tt('Could not load data', '無法載入資料') }}</p>
    <p v-if="message" class="error-state__msg">{{ message }}</p>
    <BaseButton size="sm" icon="refresh" @click="emit('retry')">{{ tt('Retry', '重試') }}</BaseButton>
  </div>
</template>

<style scoped lang="scss">
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: space(1.5);
  padding: space(10) space(4);
  text-align: center;

  &--compact {
    padding: space(6) space(3);
  }

  &__icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: $radius-full;
    background: var(--color-danger-soft);
    color: var(--color-danger);
    margin-bottom: space(1);
  }

  &__title {
    font-weight: $font-weight-semibold;
  }

  &__msg {
    max-width: 340px;
    font-size: fs('sm');
    color: var(--color-text-muted);
    margin-bottom: space(1);
  }
}
</style>
