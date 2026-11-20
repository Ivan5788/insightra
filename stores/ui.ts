import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Toast, ToastType } from '~/types/app'

/**
 * Global UI state that is not business data:
 * toasts, the confirm dialog and the mobile navigation drawer.
 */

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

let toastSeq = 0

export const useUiStore = defineStore('ui', () => {
  // ---- Toasts
  const toasts = ref<Toast[]>([])

  function showToast(type: ToastType, title: string, message?: string, timeout = 4000): number {
    const id = ++toastSeq
    toasts.value = [...toasts.value.slice(-3), { id, type, title, message, timeout }]
    if (timeout > 0) setTimeout(() => dismissToast(id), timeout)
    return id
  }

  function dismissToast(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // ---- Confirm dialog (promise based: `if (await confirm({...})) { ... }`)
  const confirmState = ref<ConfirmState | null>(null)

  function confirm(options: ConfirmOptions): Promise<boolean> {
    // If a dialog is already open, cancel it first.
    confirmState.value?.resolve(false)
    return new Promise((resolve) => {
      confirmState.value = { ...options, resolve }
    })
  }

  function resolveConfirm(value: boolean): void {
    confirmState.value?.resolve(value)
    confirmState.value = null
  }

  // ---- Mobile navigation drawer
  const mobileNavOpen = ref(false)

  return { toasts, showToast, dismissToast, confirmState, confirm, resolveConfirm, mobileNavOpen }
})
