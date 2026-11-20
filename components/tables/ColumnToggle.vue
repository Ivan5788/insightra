<script setup lang="ts">
const { tt } = useI18n()
/** Column visibility picker (choices are saved in user settings). */
defineProps<{ columns: { key: string; label: string; required?: boolean }[]; hidden: string[] }>()
const emit = defineEmits<{ toggle: [key: string] }>()
</script>

<template>
  <BaseDropdown align="right" width="220px" :close-on-select="false" :label="tt('Columns', '欄位')">
    <template #trigger="{ toggle, attrs }">
      <button
        type="button"
        class="btn btn--secondary"
        v-bind="attrs"
        data-testid="column-toggle"
        @click="toggle"
      >
        <AppIcon name="layout" :size="16" />
        <span class="hide-mobile">{{ tt('Columns', '欄位') }}</span>
      </button>
    </template>
    <p class="dropdown-label">{{ tt('Visible columns', '顯示的欄位') }}</p>
    <label v-for="col in columns" :key="col.key" class="dropdown-item col-toggle">
      <input
        type="checkbox"
        class="checkbox"
        :checked="!hidden.includes(col.key)"
        :disabled="col.required"
        @change="emit('toggle', col.key)"
      />
      {{ col.label }}
    </label>
  </BaseDropdown>
</template>

<style scoped lang="scss">
.col-toggle {
  cursor: pointer;
}
</style>
