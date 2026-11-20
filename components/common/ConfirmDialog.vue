<script setup lang="ts">
import { computed } from 'vue'

const { tt } = useI18n()

/** Global confirmation dialog driven by ui.confirm() (see useConfirm). */
const ui = useUiStore()
const state = computed(() => ui.confirmState)
</script>

<template>
  <BaseModal :open="!!state" :title="state?.title ?? ''" size="sm" @close="ui.resolveConfirm(false)">
    <p class="confirm__message">{{ state?.message }}</p>
    <template #footer>
      <BaseButton @click="ui.resolveConfirm(false)">{{
        state?.cancelLabel ?? tt('Cancel', '取消')
      }}</BaseButton>
      <BaseButton
        :variant="state?.danger ? 'danger' : 'primary'"
        data-testid="confirm-ok"
        @click="ui.resolveConfirm(true)"
      >
        {{ state?.confirmLabel ?? tt('Confirm', '確認') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped lang="scss">
.confirm__message {
  color: var(--color-text-secondary);
}
</style>
