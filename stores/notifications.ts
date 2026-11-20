import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { z } from 'zod'
import { analyticsService } from '~/services/analytics.service'
import type { NotificationItem } from '~/types/analytics'
import { tt } from '~/utils/locale'
import { readStorage, STORAGE_KEYS, writeStorage } from '~/utils/storage'

/** Notification centre: items from the API, read/unread state kept per browser. */
export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<NotificationItem[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const stored = readStorage(STORAGE_KEYS.notificationsRead, z.array(z.string()))
  const readIds = ref<Set<string>>(new Set(stored.ok ? stored.value : []))

  const unreadCount = computed(() => items.value.filter((n) => !readIds.value.has(n.id)).length)

  function isRead(id: string): boolean {
    return readIds.value.has(id)
  }

  function persist(): void {
    // Keep only ids that still exist so storage doesn't grow forever.
    const valid = [...readIds.value].filter((id) => items.value.some((n) => n.id === id))
    writeStorage(STORAGE_KEYS.notificationsRead, valid)
  }

  async function load(force = false): Promise<void> {
    if ((loaded.value && !force) || loading.value) return
    loading.value = true
    error.value = null
    try {
      items.value = await analyticsService.notifications()
      loaded.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : tt('Failed to load notifications', '無法載入通知')
    } finally {
      loading.value = false
    }
  }

  function markRead(id: string): void {
    readIds.value = new Set(readIds.value).add(id)
    persist()
  }

  function markUnread(id: string): void {
    const next = new Set(readIds.value)
    next.delete(id)
    readIds.value = next
    persist()
  }

  function markAllRead(): void {
    readIds.value = new Set(items.value.map((n) => n.id))
    persist()
  }

  return { items, loading, loaded, error, unreadCount, isRead, load, markRead, markUnread, markAllRead }
})
