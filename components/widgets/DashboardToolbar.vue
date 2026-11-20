<script setup lang="ts">
/**
 * Dashboard controls: layout switcher, create/delete layout,
 * and the edit session buttons (Add widget · Restore defaults · Cancel · Save).
 */
import { ref } from 'vue'

const { t, tt } = useI18n()
const manager = useWidgetManager()
const dashboard = useDashboard()
const store = manager.store

const showAdd = ref(false)
const showNewLayout = ref(false)
const newLayoutName = ref('')

function createLayout(): void {
  if (!newLayoutName.value.trim()) return
  dashboard.createLayout(newLayoutName.value)
  newLayoutName.value = ''
  showNewLayout.value = false
}
</script>

<template>
  <div class="dash-toolbar">
    <template v-if="!store.editing">
      <BaseDropdown align="left" width="240px" :label="t('dashboard.layouts')">
        <template #trigger="{ toggle, attrs }">
          <button
            type="button"
            class="dash-toolbar__layout"
            v-bind="attrs"
            data-testid="layout-switcher"
            @click="toggle"
          >
            <AppIcon name="layout" :size="16" />
            <span>{{ store.activeLayout.name }}</span>
            <AppIcon name="chevron-down" :size="14" />
          </button>
        </template>
        <p class="dropdown-label">{{ t('dashboard.layouts') }}</p>
        <div v-for="l in store.layouts" :key="l.id" class="dash-toolbar__layout-row">
          <button
            type="button"
            class="dropdown-item"
            :class="{ 'is-active': l.id === store.activeLayoutId }"
            data-dropdown-item
            @click="dashboard.switchLayout(l.id)"
          >
            <AppIcon :name="l.id === store.activeLayoutId ? 'check' : 'layout'" :size="16" />
            {{ l.name }}
          </button>
          <button
            v-if="store.layouts.length > 1"
            type="button"
            class="dash-toolbar__del"
            :aria-label="tt('Delete dashboard {x}', '刪除儀表板「{x}」', { x: l.name })"
            data-dropdown-item
            @click="dashboard.deleteLayout(l.id)"
          >
            <AppIcon name="trash" :size="14" />
          </button>
        </div>
        <div class="dropdown-divider" />
        <button type="button" class="dropdown-item" data-dropdown-item @click="showNewLayout = true">
          <AppIcon name="plus" :size="16" /> {{ t('dashboard.newLayout') }}
        </button>
      </BaseDropdown>

      <BaseButton
        v-if="store.hiddenCount"
        size="sm"
        variant="ghost"
        icon="eye"
        @click="store.showAllWidgets()"
      >
        {{ tt('Show {n} hidden', '顯示 {n} 個隱藏項目', { n: store.hiddenCount }) }}
      </BaseButton>
      <BaseButton icon="edit" data-testid="edit-dashboard" @click="manager.startEditing()">
        {{ t('dashboard.edit') }}
      </BaseButton>
    </template>

    <template v-else>
      <BaseButton icon="plus" variant="secondary" data-testid="add-widget" @click="showAdd = true">
        {{ t('dashboard.addWidget') }}
      </BaseButton>
      <BaseButton icon="refresh" variant="ghost" @click="manager.resetToDefault()">{{
        t('dashboard.reset')
      }}</BaseButton>
      <BaseButton variant="ghost" data-testid="cancel-edit" @click="manager.cancelEditing()">{{
        t('common.cancel')
      }}</BaseButton>
      <BaseButton icon="check" variant="primary" data-testid="save-dashboard" @click="manager.save()">
        {{ t('dashboard.done') }}
      </BaseButton>
    </template>

    <AddWidgetModal :open="showAdd" @close="showAdd = false" @add="(type) => manager.addWidget(type)" />

    <BaseModal
      :open="showNewLayout"
      :title="tt('New dashboard', '新增儀表板')"
      :description="
        tt(
          'Creates a copy of the current layout that you can customise.',
          '複製目前的配置，建立一份可自訂的新儀表板。',
        )
      "
      size="sm"
      @close="showNewLayout = false"
    >
      <form id="new-layout-form" class="field" @submit.prevent="createLayout">
        <label for="layout-name" class="field__label">{{ tt('Name', '名稱') }}</label>
        <input
          id="layout-name"
          v-model="newLayoutName"
          class="input"
          maxlength="40"
          :placeholder="tt('e.g. Weekly review', '例如：每週檢討')"
          autofocus
        />
      </form>
      <template #footer>
        <BaseButton @click="showNewLayout = false">{{ tt('Cancel', '取消') }}</BaseButton>
        <BaseButton
          variant="primary"
          type="submit"
          form="new-layout-form"
          :disabled="!newLayoutName.trim()"
          >{{ tt('Create', '建立') }}</BaseButton
        >
      </template>
    </BaseModal>
  </div>
</template>

<style scoped lang="scss">
.dash-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: space(2);

  &__layout {
    @include reset-button;
    display: inline-flex;
    align-items: center;
    gap: space(2);
    min-height: 36px;
    padding: 0 space(3);
    border-radius: $radius-md;
    border: 1px solid var(--color-border-strong);
    background: var(--color-surface);
    font-weight: $font-weight-semibold;
    @include focus-ring;

    &:hover {
      background: var(--color-surface-hover);
    }
  }

  &__layout-row {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__del {
    @include reset-button;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: $radius-sm;
    color: var(--color-text-muted);
    @include focus-ring(0);

    &:hover {
      color: var(--color-danger);
      background: var(--color-danger-soft);
    }
  }
}
</style>
