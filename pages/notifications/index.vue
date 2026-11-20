<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { IconName } from '~/data/icons'
import type { NotificationItem } from '~/types/analytics'
import { formatLongDate } from '~/utils/date'

const { t, tt } = useI18n()
const store = useNotificationStore()
onMounted(() => store.load())

type Filter = 'all' | 'unread'
const filter = ref<Filter>('all')
const tabs = computed(() => [
  { key: 'all' as Filter, label: tt('All', '全部'), badge: store.items.length },
  { key: 'unread' as Filter, label: tt('Unread', '未讀'), badge: store.unreadCount },
])
const list = computed(() =>
  filter.value === 'unread' ? store.items.filter((n) => !store.isRead(n.id)) : store.items,
)

const ICON: Record<NotificationItem['type'], { icon: IconName; tone: string }> = {
  alert: { icon: 'alert-circle', tone: 'danger' },
  warning: { icon: 'alert-triangle', tone: 'warning' },
  success: { icon: 'check-circle', tone: 'success' },
  info: { icon: 'info', tone: 'info' },
}
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.notifications.title')" :subtitle="t('page.notifications.subtitle')">
      <template #actions>
        <BaseButton icon="refresh" variant="ghost" :loading="store.loading" @click="store.load(true)">{{
          tt('Refresh', '重新整理')
        }}</BaseButton>
        <BaseButton icon="check" :disabled="!store.unreadCount" @click="store.markAllRead()">{{
          tt('Mark all as read', '全部標為已讀')
        }}</BaseButton>
      </template>
    </PageHeader>

    <section class="card">
      <BaseTabs v-model="filter" :tabs="tabs" :label="tt('Filter notifications', '篩選通知')" />
      <ErrorState v-if="store.error" :message="store.error" @retry="store.load(true)" />
      <EmptyState
        v-else-if="!store.loading && list.length === 0"
        icon="bell"
        :title="tt('You\'re all caught up', '目前沒有新通知')"
        :description="tt('No notifications to show.', '沒有可顯示的通知。')"
      />
      <ul v-else class="notif-list" role="list">
        <li v-for="n in list" :key="n.id" class="notif" :class="{ 'is-unread': !store.isRead(n.id) }">
          <span class="notif__icon" :class="'notif__icon--' + ICON[n.type].tone"
            ><AppIcon :name="ICON[n.type].icon" :size="18"
          /></span>
          <div class="notif__body">
            <p class="notif__title">
              <span v-if="!store.isRead(n.id)" class="sr-only">{{ tt('Unread: ', '未讀：') }}</span>{{
                n.title
              }}
            </p>
            <p class="notif__msg">{{ n.message }}</p>
            <div class="notif__meta">
              <time :datetime="n.date">{{ formatLongDate(n.date) }}</time>
              <NuxtLink v-if="n.link" :to="n.link" @click="store.markRead(n.id)">{{
                tt('Open →', '開啟 →')
              }}</NuxtLink>
            </div>
          </div>
          <BaseButton
            size="sm"
            variant="ghost"
            :icon="store.isRead(n.id) ? 'eye-off' : 'check'"
            icon-only
            :label="store.isRead(n.id) ? tt('Mark as unread', '標為未讀') : tt('Mark as read', '標為已讀')"
            @click="store.isRead(n.id) ? store.markUnread(n.id) : store.markRead(n.id)"
          />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.notif-list {
  margin: space(2) 0 0;
  padding: 0;
}

.notif {
  display: flex;
  align-items: flex-start;
  gap: space(3);
  padding: space(4) space(2);
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: 0;
  }

  &.is-unread {
    background: linear-gradient(90deg, var(--color-primary-soft), transparent 60%);
    border-radius: $radius-md;

    .notif__title {
      font-weight: $font-weight-bold;
    }
  }

  &__icon {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: $radius-full;

    &--danger {
      background: var(--color-danger-soft);
      color: var(--color-danger);
    }

    &--warning {
      background: var(--color-warning-soft);
      color: var(--color-warning);
    }

    &--success {
      background: var(--color-success-soft);
      color: var(--color-success);
    }

    &--info {
      background: var(--color-info-soft);
      color: var(--color-info);
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-weight: $font-weight-semibold;
  }

  &__msg {
    margin-top: 2px;
    color: var(--color-text-secondary);
    font-size: fs('sm');
  }

  &__meta {
    display: flex;
    gap: space(4);
    margin-top: space(1.5);
    font-size: fs('xs');
    color: var(--color-text-muted);
  }
}
</style>
