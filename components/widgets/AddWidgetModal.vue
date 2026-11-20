<script setup lang="ts">
import { WIDGET_REGISTRY, WIDGET_TYPES, widgetDescription, widgetLabel } from '~/data/widget-registry'
import type { WidgetType } from '~/types/widgets'

const { tt } = useI18n()

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; add: [type: WidgetType] }>()

function add(type: WidgetType): void {
  emit('add', type)
  emit('close')
}
</script>

<template>
  <BaseModal
    :open="open"
    :title="tt('Add a widget', '新增 Widget')"
    :description="
      tt(
        'Choose a widget type. You can change its settings afterwards.',
        '選擇 Widget 類型，之後仍可調整設定。',
      )
    "
    size="lg"
    @close="emit('close')"
  >
    <ul class="widget-types" role="list">
      <li v-for="type in WIDGET_TYPES" :key="type">
        <button type="button" class="widget-type" :data-testid="'add-' + type" @click="add(type)">
          <span class="widget-type__icon"><AppIcon :name="WIDGET_REGISTRY[type].icon" :size="20" /></span>
          <span class="widget-type__text">
            <b>{{ widgetLabel(type) }}</b>
            <span>{{ widgetDescription(type) }}</span>
          </span>
          <AppIcon name="plus" :size="16" class="widget-type__plus" />
        </button>
      </li>
    </ul>
  </BaseModal>
</template>

<style scoped lang="scss">
.widget-types {
  display: grid;
  gap: space(2);
  margin: 0;
  padding: 0;

  @include up('sm') {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.widget-type {
  @include reset-button;
  display: flex;
  align-items: center;
  gap: space(3);
  width: 100%;
  height: 100%;
  padding: space(3);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  text-align: left;
  transition:
    border-color $transition-fast,
    background-color $transition-fast;
  @include focus-ring;

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
  }

  &__icon {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: var(--color-surface-2);
    color: var(--color-primary);
  }

  &__text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;

    span {
      font-size: fs('sm');
      color: var(--color-text-muted);
    }
  }

  &__plus {
    color: var(--color-text-muted);
  }
}
</style>
