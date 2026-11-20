/** Convenience wrapper: `const toast = useToast(); toast.success('Saved')` */
export function useToast() {
  const ui = useUiStore()
  return {
    success: (title: string, message?: string) => ui.showToast('success', title, message),
    error: (title: string, message?: string) => ui.showToast('error', title, message, 6000),
    info: (title: string, message?: string) => ui.showToast('info', title, message),
    warning: (title: string, message?: string) => ui.showToast('warning', title, message, 5000),
  }
}

/** Promise-based confirmation dialog: `if (await confirm({...})) { ... }` */
export function useConfirm() {
  const ui = useUiStore()
  return { confirm: ui.confirm }
}
