<script setup lang="ts">
import { computed } from 'vue'
import { NAV_ITEMS } from '~/data/navigation'

/**
 * Sidebar navigation.
 *  - desktop: fixed, collapsible to icons only (state saved in settings)
 *  - mobile : the same component rendered inside a drawer (variant="drawer")
 */
const props = withDefaults(defineProps<{ collapsed?: boolean; variant?: 'desktop' | 'drawer' }>(), {
  variant: 'desktop',
})

const { t, tt } = useI18n()
const route = useRoute()
const settings = useSettingsStore()
const notifications = useNotificationStore()

const isCollapsed = computed(() => props.variant === 'desktop' && props.collapsed)
const sections = computed(() => [
  { key: 'analyze', label: t('nav.sectionAnalyze'), items: NAV_ITEMS.filter((i) => i.section === 'analyze') },
  { key: 'manage', label: t('nav.sectionManage'), items: NAV_ITEMS.filter((i) => i.section === 'manage') },
])

function isActive(to: string): boolean {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

function toggle(): void {
  settings.update({ sidebarCollapsed: !settings.settings.sidebarCollapsed })
}
</script>

<template>
  <aside class="app-sidebar" :class="['app-sidebar--' + variant, { 'is-collapsed': isCollapsed }]">
    <div v-if="variant === 'desktop'" class="app-sidebar__brand">
      <NuxtLink to="/" class="app-sidebar__logo" :aria-label="tt('Insightra home', 'Insightra 首頁')">
        <AppLogo :size="32" :show-text="!isCollapsed" />
      </NuxtLink>
    </div>

    <nav class="app-sidebar__nav" :aria-label="t('nav.main')">
      <div v-for="section in sections" :key="section.key" class="app-sidebar__section">
        <p class="app-sidebar__heading" :class="{ 'sr-only': isCollapsed }">{{ section.label }}</p>
        <ul role="list">
          <li v-for="item in section.items" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="app-sidebar__link"
              :class="{ 'is-active': isActive(item.to) }"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              :title="isCollapsed ? t(item.labelKey) : undefined"
            >
              <AppIcon :name="item.icon" :size="19" />
              <span class="app-sidebar__label">{{ t(item.labelKey) }}</span>
              <span
                v-if="item.to === '/notifications' && notifications.unreadCount > 0"
                class="app-sidebar__count"
                :aria-label="tt('{n} unread', '{n} 則未讀', { n: notifications.unreadCount })"
              >
                {{ notifications.unreadCount }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </nav>

    <div class="app-sidebar__footer">
      <div v-if="!isCollapsed" class="app-sidebar__workspace">
        <span class="app-sidebar__avatar" aria-hidden="true">AL</span>
        <span class="app-sidebar__ws-text">
          <b>Aurora Living Co.</b>
          <span>{{ tt('Demo workspace', '示範工作區') }}</span>
        </span>
      </div>
      <button
        v-if="variant === 'desktop'"
        type="button"
        class="app-sidebar__collapse"
        :aria-label="isCollapsed ? t('nav.expand') : t('nav.collapse')"
        :aria-expanded="!isCollapsed"
        @click="toggle"
      >
        <AppIcon :name="isCollapsed ? 'chevron-right' : 'chevron-left'" :size="16" />
      </button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.app-sidebar {
  display: flex;
  flex-direction: column;
  background: var(--color-surface);

  &--desktop {
    border-right: 1px solid var(--color-border);
    height: 100vh;
  }

  &--drawer {
    height: 100%;
  }

  &__brand {
    display: flex;
    align-items: center;
    height: $header-height;
    padding: 0 space(5);
    border-bottom: 1px solid var(--color-border);
  }

  &__logo {
    border-radius: $radius-md;

    &:hover {
      text-decoration: none;
    }
  }

  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: space(4) space(3);
    @include scrollbar-thin;
  }

  &__section + &__section {
    margin-top: space(5);
  }

  &__heading {
    padding: 0 space(3) space(2);
    font-size: 11px;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-text-muted);
  }

  ul {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: space(3);
    min-height: 40px;
    padding: 0 space(3);
    border-radius: $radius-md;
    color: var(--color-text-secondary);
    font-weight: $font-weight-medium;
    transition:
      background-color $transition-fast,
      color $transition-fast;

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text);
      text-decoration: none;
    }

    &.is-active {
      background: var(--color-primary-soft);
      color: var(--color-primary-soft-text);

      :deep(.app-icon) {
        color: var(--color-primary);
      }
    }

    @media (pointer: coarse) {
      min-height: $touch-target;
    }
  }

  &__label {
    flex: 1;
    @include truncate;
  }

  &__count {
    min-width: 20px;
    padding: 0 6px;
    border-radius: $radius-full;
    background: var(--color-danger);
    color: #fff;
    font-size: 11px;
    font-weight: $font-weight-semibold;
    text-align: center;
    line-height: 18px;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: space(2);
    padding: space(3);
    border-top: 1px solid var(--color-border);
  }

  &__workspace {
    flex: 1;
    display: flex;
    align-items: center;
    gap: space(2.5);
    min-width: 0;
    padding: space(1.5);
  }

  &__avatar {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    color: #fff;
    font-size: fs('xs');
    font-weight: $font-weight-bold;
  }

  &__ws-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    font-size: fs('sm');
    line-height: 1.3;

    b {
      @include truncate;
    }

    span {
      color: var(--color-text-muted);
      font-size: fs('xs');
    }
  }

  &__collapse {
    @include reset-button;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    margin-left: auto;
    border-radius: $radius-md;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    @include focus-ring;

    &:hover {
      background: var(--color-surface-hover);
      color: var(--color-text);
    }
  }

  // Collapsed (icons only)
  &.is-collapsed {
    .app-sidebar__brand {
      justify-content: center;
      padding: 0;
    }

    .app-sidebar__nav {
      padding: space(4) space(2);
    }

    .app-sidebar__link {
      justify-content: center;
      padding: 0;
      position: relative;
    }

    .app-sidebar__label {
      @include visually-hidden;
    }

    .app-sidebar__count {
      position: absolute;
      top: 4px;
      right: 6px;
      min-width: 16px;
      padding: 0 4px;
      line-height: 16px;
      font-size: 10px;
    }

    .app-sidebar__footer {
      justify-content: center;
    }

    .app-sidebar__collapse {
      margin: 0;
    }
  }
}
</style>
