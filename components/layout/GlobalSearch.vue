<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { categoryLabel, productLabel, PRODUCTS } from '~/data/catalog'
import { NAV_ITEMS } from '~/data/navigation'
import type { IconName } from '~/data/icons'

/**
 * Global search (Ctrl/⌘ + K). Searches pages, products and order ids.
 * Implements the ARIA combobox pattern: arrow keys move the active option,
 * Enter selects, Esc closes.
 */
interface Result {
  id: string
  group: 'Pages' | 'Products' | 'Orders'
  label: string
  hint: string
  icon: IconName
  action: () => void
}

const { t, tt } = useI18n()
const { openProduct } = useDrillDown()
const router = useRouter()

const query = ref('')
const open = ref(false)
const active = ref(0)
const input = ref<HTMLInputElement | null>(null)
const listId = 'search-list-' + useId()
const GROUP_LABEL: Record<Result['group'], string> = {
  Pages: tt('Pages', '頁面'),
  Products: tt('Products', '商品'),
  Orders: tt('Orders', '訂單'),
}

const results = computed<Result[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return []
  const pages: Result[] = NAV_ITEMS.filter((i) =>
    (t(i.labelKey) + ' ' + i.keywords).toLowerCase().includes(q),
  )
    .slice(0, 4)
    .map((i) => ({
      id: 'page-' + i.to,
      group: 'Pages',
      label: t(i.labelKey),
      hint: i.to,
      icon: i.icon,
      action: () => router.push(i.to),
    }))
  // Match both the English and the localized product name.
  const products: Result[] = PRODUCTS.filter((p) =>
    (p.name + ' ' + productLabel(p.id)).toLowerCase().includes(q),
  )
    .slice(0, 5)
    .map((p) => ({
      id: 'product-' + p.id,
      group: 'Products',
      label: productLabel(p.id),
      hint: categoryLabel(p.category) + tt(' · open sales detail', ' · 開啟銷售明細'),
      icon: 'cart',
      action: () => openProduct(p.id),
    }))
  const orders: Result[] = /^ord-?\d*/i.test(q)
    ? [
        {
          id: 'orders-' + q,
          group: 'Orders',
          label: tt('Search orders for "{x}"', '搜尋訂單「{x}」', { x: query.value.trim().toUpperCase() }),
          hint: tt('Data table', '資料表'),
          icon: 'table',
          action: () => router.push({ path: '/data', query: { search: query.value.trim().toUpperCase() } }),
        },
      ]
    : []
  return [...pages, ...products, ...orders]
})

function select(result: Result | undefined): void {
  if (!result) return
  result.action()
  query.value = ''
  open.value = false
  input.value?.blur()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    active.value = Math.min(active.value + 1, results.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = Math.max(active.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    select(results.value[active.value])
  } else if (event.key === 'Escape') {
    open.value = false
    input.value?.blur()
  }
}

function onInput(): void {
  open.value = true
  active.value = 0
}

const root = ref<HTMLElement | null>(null)

/** Close when focus leaves the whole component (not when moving inside it). */
function onFocusOut(event: FocusEvent): void {
  if (!root.value?.contains(event.relatedTarget as Node | null)) open.value = false
}

function onShortcut(event: KeyboardEvent): void {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    input.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onShortcut))
</script>

<template>
  <div ref="root" class="gsearch" @focusout="onFocusOut">
    <AppIcon name="search" :size="16" class="gsearch__icon" />
    <input
      ref="input"
      v-model="query"
      type="text"
      class="gsearch__input"
      role="combobox"
      :aria-expanded="open && results.length > 0"
      :aria-controls="listId"
      :aria-activedescendant="open && results[active] ? listId + '-' + active : undefined"
      aria-autocomplete="list"
      :aria-label="t('header.search')"
      :placeholder="t('header.search')"
      @input="onInput"
      @focus="open = true"
      @keydown="onKeydown"
    />
    <kbd class="gsearch__kbd hide-mobile" aria-hidden="true">Ctrl K</kbd>

    <ul v-if="open && query" :id="listId" class="gsearch__results" role="listbox">
      <li v-if="results.length === 0" class="gsearch__empty" role="presentation">
        {{ tt('No results for "{x}"', '找不到「{x}」的結果', { x: query }) }}
      </li>
      <li
        v-for="(r, i) in results"
        :id="listId + '-' + i"
        :key="r.id"
        role="option"
        class="gsearch__option"
        :class="{ 'is-active': i === active }"
        :aria-selected="i === active"
        @mousedown.prevent="select(r)"
        @mouseenter="active = i"
      >
        <span class="gsearch__opt-icon"><AppIcon :name="r.icon" :size="16" /></span>
        <span class="gsearch__opt-text">
          <span class="gsearch__opt-label">{{ r.label }}</span>
          <span class="gsearch__opt-hint">{{ GROUP_LABEL[r.group] }} · {{ r.hint }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.gsearch {
  position: relative;
  min-width: 0;

  &__icon {
    position: absolute;
    left: space(3);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
    pointer-events: none;
  }

  &__input {
    width: 100%;
    height: 38px;
    padding: 0 space(16) 0 space(9);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    background: var(--color-surface-2);
    color: var(--color-text);
    font-size: fs('base');
    transition:
      border-color $transition-fast,
      background-color $transition-fast;

    &::placeholder {
      color: var(--color-text-muted);
    }

    &:focus {
      outline: none;
      background: var(--color-surface);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    @include down('md') {
      padding-right: space(3);

      &::placeholder {
        color: transparent;
      }
    }
  }

  &__kbd {
    position: absolute;
    right: space(2);
    top: 50%;
    transform: translateY(-50%);
    padding: 1px space(1.5);
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    background: var(--color-surface);
    font-family: $font-sans;
    font-size: 11px;
    color: var(--color-text-muted);
  }

  &__results {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: z('dropdown');
    margin: 0;
    padding: space(1.5);
    list-style: none;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;
    box-shadow: var(--shadow-lg);
    max-height: 60vh;
    overflow-y: auto;

    @include down('md') {
      position: fixed;
      top: $header-height;
      left: space(3);
      right: space(3);
    }
  }

  &__empty {
    padding: space(3);
    color: var(--color-text-muted);
    font-size: fs('sm');
  }

  &__option {
    display: flex;
    align-items: center;
    gap: space(3);
    padding: space(2) space(2.5);
    border-radius: $radius-md;
    cursor: pointer;

    &.is-active {
      background: var(--color-surface-hover);
    }
  }

  &__opt-icon {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: $radius-md;
    background: var(--color-surface-2);
    color: var(--color-text-secondary);
  }

  &__opt-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__opt-label {
    font-weight: $font-weight-medium;
    @include truncate;
  }

  &__opt-hint {
    font-size: fs('xs');
    color: var(--color-text-muted);
  }
}
</style>
