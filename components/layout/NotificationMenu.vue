<script setup lang="ts">
import { onMounted } from 'vue'
import { formatShortDate } from '~/utils/date'

const { t, tt } = useI18n()
const store = useNotificationStore()

onMounted(() => store.load())
</script>

<template>
  <BaseDropdown align="right" width="360px" :label="t('header.notifications')">
    <template #trigger="{ toggle, attrs }">
      <button
        type="button"
        class="notif-btn"
        v-bind="attrs"
        :aria-label="
          t('header.notifications') +
          (store.unreadCount ? tt(', {n} unread', '，{n} 則未讀', { n: store.unreadCount }) : '')
        "
        @click="toggle"
      >
        <AppIcon name="bell" :size="19" />
        <span v-if="store.unreadCount" class="notif-btn__dot">{{
          store.unreadCount > 9 ? '9+' : store.unreadCount
        }}</span>
      </button>
    </template>

    <template #default="{ close }">
      <div class="notif-menu">
        <div class="notif-menu__head">
          <b>{{ t('header.notifications') }}</b>
          <button
            v-if="store.unreadCount"
            type="button"
            class="notif-menu__link"
            @click="store.markAllRead()"
          >
            Mark all as read
          </button>
        </div>
        <div v-if="store.loading" class="notif-menu__state"><LoadingSpinner /></div>
        <p v-else-if="store.items.length === 0" class="notif-menu__state">
          {{ tt("You're all caught up.", '目前沒有新通知。') }}
        </p>
        <ul v-else class="notif-menu__list" role="list">
          <li v-for="n in store.items.slice(0, 5)" :key="n.id">
            <NuxtLink
              :to="n.link ?? '/notifications'"
              class="notif-menu__item"
              :class="{ 'is-unread': !store.isRead(n.id) }"
              data-dropdown-item
              @click="store.markRead(n.id)"
            >
              <span class="notif-menu__title">{{ n.title }}</span>
              <span class="notif-menu__msg">{{ n.message }}</span>
              <span class="notif-menu__date">{{ formatShortDate(n.date) }}</span>
            </NuxtLink>
          </li>
        </ul>
        <NuxtLink to="/notifications" class="notif-menu__all" @click="close">{{
          t('common.viewAll')
        }}</NuxtLink>
      </div>
    </template>
  </BaseDropdown>
</template>

<style scoped lang="scss">
.notif-btn {
  @include reset-button;
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: $radius-md;
  color: var(--color-text-secondary);
  @include focus-ring;

  &:hover {
    background: var(--color-surface-hover);
    color: var(--color-text);
  }

  &__dot {
    position: absolute;
    top: 5px;
    right: 4px;
    min-width: 17px;
    padding: 0 4px;
    border-radius: $radius-full;
    border: 2px solid var(--color-surface);
    background: var(--color-danger);
    color: #fff;
    font-size: 10px;
    font-weight: $font-weight-bold;
    line-height: 13px;
    text-align: center;
  }
}

.notif-menu {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: space(2) space(2.5) space(2.5);
  }

  &__link {
    @include reset-button;
    font-size: fs('sm');
    color: var(--color-primary);
  }

  &__state {
    display: grid;
    place-items: center;
    padding: space(6);
    color: var(--color-text-muted);
  }

  &__list {
    margin: 0;
    padding: 0;
    max-height: 360px;
    overflow-y: auto;
  }

  &__item {
    position: relative;
    display: grid;
    gap: 2px;
    padding: space(2.5) space(2.5) space(2.5) space(5);
    border-radius: $radius-md;
    color: var(--color-text);

    &:hover {
      background: var(--color-surface-hover);
      text-decoration: none;
    }

    &.is-unread::before {
      content: '';
      position: absolute;
      left: space(2);
      top: space(4);
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--color-primary);
    }
  }

  &__title {
    font-weight: $font-weight-semibold;
    font-size: fs('sm');
  }

  &__msg {
    font-size: fs('sm');
    color: var(--color-text-secondary);
  }

  &__date {
    font-size: fs('xs');
    color: var(--color-text-muted);
  }

  &__all {
    display: block;
    margin-top: space(1);
    padding: space(2.5);
    border-top: 1px solid var(--color-border);
    text-align: center;
    font-size: fs('sm');
    font-weight: $font-weight-medium;
  }
}
</style>
