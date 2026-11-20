<script setup lang="ts">
import { computed } from 'vue'
import type { Locale, ThemeMode } from '~/types/app'

const { t, tt } = useI18n()
const auth = useAuthStore()
const settings = useSettingsStore()

const name = computed(() => settings.settings.profile.name || auth.user?.name || tt('User', '使用者'))
const initials = computed(() =>
  name.value
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

function logout(): void {
  auth.logout()
  navigateTo('/auth/login')
}

const themes: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: t('settings.light') },
  { value: 'dark', label: t('settings.dark') },
  { value: 'system', label: t('settings.system') },
]
const locales: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'zh-TW', label: '繁中' },
]
</script>

<template>
  <BaseDropdown align="right" width="260px" :close-on-select="true" :label="t('header.account')">
    <template #trigger="{ toggle, attrs }">
      <button type="button" class="user-btn" v-bind="attrs" :aria-label="t('header.account')" @click="toggle">
        <span class="user-btn__avatar" aria-hidden="true">{{ initials }}</span>
        <span class="user-btn__name hide-mobile">{{ name }}</span>
        <AppIcon name="chevron-down" :size="16" class="hide-mobile" />
      </button>
    </template>

    <div class="user-menu__head">
      <b>{{ name }}</b>
      <span>{{ settings.settings.profile.email }}</span>
    </div>
    <div class="dropdown-divider" />
    <NuxtLink to="/profile" class="dropdown-item" data-dropdown-item>
      <AppIcon name="user" :size="16" /> {{ t('nav.profile') }}
    </NuxtLink>
    <NuxtLink to="/settings" class="dropdown-item" data-dropdown-item>
      <AppIcon name="settings" :size="16" /> {{ t('nav.settings') }}
    </NuxtLink>
    <div class="dropdown-divider" />
    <p class="dropdown-label">{{ t('settings.theme') }}</p>
    <div class="user-menu__row">
      <SegmentedControl
        :model-value="settings.settings.theme"
        size="sm"
        :label="t('settings.theme')"
        :options="themes"
        @update:model-value="settings.setTheme"
      />
    </div>
    <p class="dropdown-label">{{ t('settings.language') }}</p>
    <div class="user-menu__row">
      <SegmentedControl
        :model-value="settings.settings.locale"
        size="sm"
        :label="t('settings.language')"
        :options="locales"
        @update:model-value="(v: Locale) => settings.update({ locale: v })"
      />
    </div>
    <div class="dropdown-divider" />
    <button type="button" class="dropdown-item is-danger" data-dropdown-item @click="logout">
      <AppIcon name="log-out" :size="16" /> {{ t('header.logout') }}
    </button>
  </BaseDropdown>
</template>

<style scoped lang="scss">
.user-btn {
  @include reset-button;
  display: flex;
  align-items: center;
  gap: space(2);
  height: 40px;
  padding: 0 space(1.5);
  border-radius: $radius-md;
  color: var(--color-text-secondary);
  @include focus-ring;

  &:hover {
    background: var(--color-surface-hover);
  }

  &__avatar {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: $radius-full;
    background: var(--color-primary-soft);
    color: var(--color-primary-soft-text);
    font-size: fs('xs');
    font-weight: $font-weight-bold;
  }

  &__name {
    font-weight: $font-weight-medium;
    color: var(--color-text);
    max-width: 140px;
    @include truncate;
  }
}

.user-menu {
  &__head {
    display: flex;
    flex-direction: column;
    padding: space(2) space(2.5);

    span {
      font-size: fs('sm');
      color: var(--color-text-muted);
    }
  }

  &__row {
    padding: 0 space(2.5) space(2);
  }
}
</style>
