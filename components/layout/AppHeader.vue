<script setup lang="ts">
const { t, tt } = useI18n()
const ui = useUiStore()
const settings = useSettingsStore()
</script>

<template>
  <header class="app-header">
    <button
      type="button"
      class="app-header__menu"
      :aria-label="t('nav.openMenu')"
      @click="ui.mobileNavOpen = true"
    >
      <AppIcon name="menu" :size="20" />
    </button>
    <NuxtLink to="/" class="app-header__logo" :aria-label="tt('Insightra home', 'Insightra 首頁')">
      <AppLogo :size="28" :show-text="false" />
    </NuxtLink>

    <GlobalSearch class="app-header__search" />

    <div class="app-header__actions">
      <MockDataBadge class="hide-mobile" />
      <button
        type="button"
        class="app-header__icon-btn"
        :aria-label="t('header.theme')"
        :aria-pressed="settings.resolvedTheme === 'dark'"
        data-testid="theme-toggle"
        @click="settings.toggleTheme()"
      >
        <AppIcon :name="settings.resolvedTheme === 'dark' ? 'sun' : 'moon'" :size="19" />
      </button>
      <NotificationMenu />
      <UserMenu />
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: z('header');
  display: flex;
  align-items: center;
  gap: space(2);
  height: $header-height;
  padding: 0 space(3);
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  backdrop-filter: saturate(1.4) blur(10px);
  border-bottom: 1px solid var(--color-border);

  @include up('md') {
    gap: space(3);
    padding: 0 space(6);
  }

  @include up('xl') {
    padding: 0 space(8);
  }

  &__menu,
  &__icon-btn {
    @include reset-button;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: $radius-md;
    color: var(--color-text-secondary);
    @include focus-ring;

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }
  }

  &__menu,
  &__logo {
    @include up('lg') {
      display: none;
    }
  }

  &__logo {
    border-radius: $radius-md;
  }

  &__search {
    flex: 1;
    max-width: 480px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: space(1);
    margin-left: auto;
  }
}
</style>
