<script setup lang="ts">
const { tt } = useI18n()
/**
 * App shell for authenticated pages:
 *   sidebar (desktop) / drawer (mobile) · header · main · footer
 * plus the global drill-down panel, which any page can open.
 */
const settings = useSettingsStore()
const ui = useUiStore()
const route = useRoute()

// Keep global filters in the URL (shareable links, back/forward support).
useFilterUrlSync()

watch(
  () => route.path,
  () => {
    ui.mobileNavOpen = false
  },
)
</script>

<template>
  <div class="app-shell" :class="{ 'is-collapsed': settings.settings.sidebarCollapsed }">
    <a href="#main" class="skip-link">{{ tt('Skip to main content', '跳到主要內容') }}</a>

    <AppSidebar class="app-shell__sidebar" :collapsed="settings.settings.sidebarCollapsed" />

    <BaseDrawer
      :open="ui.mobileNavOpen"
      side="left"
      width="288px"
      :title="tt('Menu', '選單')"
      @close="ui.mobileNavOpen = false"
    >
      <AppSidebar variant="drawer" />
    </BaseDrawer>

    <div class="app-shell__content">
      <AppHeader />
      <main id="main" class="app-shell__main" tabindex="-1">
        <slot />
      </main>
      <AppFooter />
    </div>

    <DrillDownPanel />
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;

  &__sidebar {
    display: none;

    @include up('lg') {
      display: flex;
      position: fixed;
      inset: 0 auto 0 0;
      width: $sidebar-width;
      z-index: z('sidebar');
      transition: width $transition-base;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-width: 0;

    @include up('lg') {
      margin-left: $sidebar-width;
      transition: margin-left $transition-base;
    }
  }

  &.is-collapsed {
    .app-shell__sidebar {
      @include up('lg') {
        width: $sidebar-collapsed-width;
      }
    }

    .app-shell__content {
      @include up('lg') {
        margin-left: $sidebar-collapsed-width;
      }
    }
  }

  &__main {
    flex: 1;
    width: 100%;
    padding: space(4);
    outline: none;

    @include up('md') {
      padding: space(6);
    }

    @include up('xl') {
      padding: space(6) space(8);
    }
  }
}

.skip-link {
  position: absolute;
  left: space(2);
  top: -100px;
  z-index: z('tooltip');
  padding: space(2) space(3);
  border-radius: $radius-md;
  background: var(--color-primary);
  color: var(--color-on-primary);

  &:focus {
    top: space(2);
  }
}
</style>
