import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessibility for dialogs/drawers:
 *  - moves focus inside when opened
 *  - keeps Tab / Shift+Tab inside the container
 *  - returns focus to the element that opened it
 *  - locks page scroll behind the overlay
 */
export function useFocusTrap(container: Ref<HTMLElement | null>, active: Ref<boolean>) {
  let previouslyFocused: HTMLElement | null = null

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !container.value) return
    const items = [...container.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    )
    if (items.length === 0) {
      event.preventDefault()
      return
    }
    const first = items[0]!
    const last = items[items.length - 1]!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function release(): void {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
    previouslyFocused?.focus?.()
    previouslyFocused = null
  }

  watch(active, async (isActive) => {
    if (isActive) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      document.body.style.overflow = 'hidden'
      await nextTick()
      const target =
        container.value?.querySelector<HTMLElement>('[autofocus]') ??
        container.value?.querySelector<HTMLElement>(FOCUSABLE) ??
        container.value
      target?.focus()
    } else {
      release()
    }
  })

  onBeforeUnmount(() => {
    if (active.value) release()
  })
}
