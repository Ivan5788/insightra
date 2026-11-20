<script setup lang="ts">
/** Settings — profile, preferences (theme, language, defaults), notifications, system info. */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { analyticsService } from '~/services/analytics.service'
import { DATE_PRESETS } from '~/stores/filters'
import type { DatasetInfo } from '~/types/api'
import type { Locale, ThemeMode } from '~/types/app'
import { formatLongDate } from '~/utils/date'
import { formatNumber } from '~/utils/format'
import { clearAppStorage } from '~/utils/storage'
import { clearQueryCache } from '~/composables/useApiQuery'

const { t, tt } = useI18n()
const settings = useSettingsStore()
const dashboard = useDashboardStore()
const toast = useToast()
const { confirm } = useConfirm()
const config = useRuntimeConfig()
const route = useRoute()

type Tab = 'profile' | 'preferences' | 'notifications' | 'system'
const tab = ref<Tab>(
  (['profile', 'preferences', 'notifications', 'system'] as Tab[]).includes(route.query.tab as Tab)
    ? (route.query.tab as Tab)
    : 'profile',
)
// Keep the active tab in the URL: switching language re-mounts the page,
// and this way the user stays on the tab they were on.
watch(tab, (v) => {
  void navigateTo({ query: { ...route.query, tab: v } }, { replace: true })
})
const tabs: { key: Tab; label: string; icon: 'user' | 'settings' | 'bell' | 'info' }[] = [
  { key: 'profile', label: tt('Profile', '個人資料'), icon: 'user' },
  { key: 'preferences', label: tt('Preferences', '偏好設定'), icon: 'settings' },
  { key: 'notifications', label: tt('Notifications', '通知'), icon: 'bell' },
  { key: 'system', label: tt('System', '系統'), icon: 'info' },
]

// ---- Profile form (edits a copy; saved explicitly) --------------------------
const profile = reactive({ ...settings.settings.profile })
const profileErrors = ref<{ name?: string; email?: string }>({})
const TIMEZONES = [
  'Asia/Taipei',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'Europe/London',
  'America/New_York',
]

function saveProfile(): void {
  profileErrors.value = {}
  if (!profile.name.trim()) profileErrors.value.name = tt('Name is required.', '請輸入姓名。')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email))
    profileErrors.value.email = tt('Enter a valid email.', '請輸入有效的 Email。')
  if (Object.keys(profileErrors.value).length) return
  settings.update({ profile: { ...profile, name: profile.name.trim() } })
  toast.success(tt('Profile saved', '個人資料已儲存'))
}

// ---- Preferences (applied instantly) -------------------------------------------
const themeOptions: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: t('settings.light') },
  { value: 'dark', label: t('settings.dark') },
  { value: 'system', label: t('settings.system') },
]
const localeOptions: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
]
const presetOptions = DATE_PRESETS.filter((p) => p.key !== 'custom').map((p) => ({
  value: p.key,
  label: p.label,
}))

// ---- System info -------------------------------------------------------------------
const meta = ref<DatasetInfo | null>(null)
onMounted(async () => {
  try {
    meta.value = await analyticsService.meta()
  } catch {
    meta.value = null
  }
})

const storageSize = computed(() => {
  try {
    let bytes = 0
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('insightra:')) bytes += k.length + (localStorage.getItem(k)?.length ?? 0)
    }
    return (bytes / 1024).toFixed(1) + ' KB'
  } catch {
    return tt('unavailable', '無法取得')
  }
})

async function resetDashboards(): Promise<void> {
  const ok = await confirm({
    title: tt('Reset dashboards?', '重設儀表板？'),
    message: tt(
      'All custom dashboards and widget layouts will be replaced by the defaults.',
      '所有自訂儀表板與 Widget 配置都會被預設值取代。',
    ),
    confirmLabel: tt('Reset', '重設'),
    danger: true,
  })
  if (!ok) return
  dashboard.resetAll()
  toast.success(tt('Dashboards reset', '儀表板已重設'))
}

async function resetAll(): Promise<void> {
  const ok = await confirm({
    title: tt('Reset all local data?', '重設所有本機資料？'),
    message: tt(
      'Preferences, dashboards, reports, filters and read notifications stored in this browser will be deleted and you will be signed out.',
      '儲存在此瀏覽器的偏好設定、儀表板、報表、篩選條件與已讀通知都會被刪除，並且會登出。',
    ),
    confirmLabel: tt('Reset everything', '全部重設'),
    danger: true,
  })
  if (!ok) return
  clearAppStorage()
  clearQueryCache()
  window.location.href = '/auth/login'
}
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.settings.title')" :subtitle="t('page.settings.subtitle')" />

    <BaseTabs v-model="tab" :tabs="tabs" :label="tt('Settings sections', '設定分類')">
      <!-- Profile -->
      <section v-if="tab === 'profile'" class="card settings-card">
        <h2 class="card__title">{{ tt('Personal information', '個人資訊') }}</h2>
        <form class="settings-form" novalidate @submit.prevent="saveProfile">
          <div class="field">
            <label for="s-name" class="field__label">{{ tt('Full name', '姓名') }}</label>
            <input id="s-name" v-model="profile.name" class="input" :aria-invalid="!!profileErrors.name" />
            <p v-if="profileErrors.name" class="field__error">{{ profileErrors.name }}</p>
          </div>
          <div class="field">
            <label for="s-email" class="field__label">Email</label>
            <input
              id="s-email"
              v-model="profile.email"
              type="email"
              class="input"
              :aria-invalid="!!profileErrors.email"
            />
            <p v-if="profileErrors.email" class="field__error">{{ profileErrors.email }}</p>
          </div>
          <div class="field">
            <label for="s-title" class="field__label">{{ tt('Job title', '職稱') }}</label>
            <input id="s-title" v-model="profile.title" class="input" />
          </div>
          <div class="field">
            <label for="s-company" class="field__label">{{ tt('Company', '公司') }}</label>
            <input id="s-company" v-model="profile.company" class="input" />
          </div>
          <SelectInput
            v-model="profile.timezone"
            :label="tt('Time zone', '時區')"
            :options="TIMEZONES.map((z) => ({ value: z, label: z }))"
          />
          <div class="settings-form__actions">
            <BaseButton type="submit" variant="primary" data-testid="save-profile">{{
              t('common.save')
            }}</BaseButton>
          </div>
        </form>
      </section>

      <!-- Preferences -->
      <section v-else-if="tab === 'preferences'" class="card settings-card">
        <h2 class="card__title">{{ tt('Appearance & defaults', '外觀與預設值') }}</h2>
        <p class="card__subtitle">
          {{
            tt(
              'Changes apply immediately and are remembered in this browser.',
              '變更會立即套用，並記錄在此瀏覽器。',
            )
          }}
        </p>
        <div class="pref-list">
          <div class="pref-row">
            <div>
              <b>{{ t('settings.theme') }}</b>
              <p>{{ tt('Light, dark or follow your operating system.', '淺色、深色，或跟隨作業系統。') }}</p>
            </div>
            <SegmentedControl
              :model-value="settings.settings.theme"
              :options="themeOptions"
              :label="t('settings.theme')"
              @update:model-value="settings.setTheme"
            />
          </div>
          <div class="pref-row">
            <div>
              <b>{{ t('settings.language') }}</b>
              <p>
                {{
                  tt(
                    'All interface text, dates and mock data labels.',
                    '所有介面文字、日期格式與模擬資料標籤。',
                  )
                }}
              </p>
            </div>
            <SegmentedControl
              :model-value="settings.settings.locale"
              :options="localeOptions"
              :label="t('settings.language')"
              @update:model-value="(v: Locale) => settings.update({ locale: v })"
            />
          </div>
          <div class="pref-row">
            <div>
              <b>{{ tt('Default date range', '預設日期範圍') }}</b>
              <p>
                {{ tt('Used on first visit and after resetting filters.', '首次造訪與重設篩選時使用。') }}
              </p>
            </div>
            <SelectInput
              :model-value="settings.settings.defaultPreset"
              :label="tt('Default date range', '預設日期範圍')"
              hide-label
              :options="presetOptions"
              @update:model-value="(v) => v && settings.update({ defaultPreset: v })"
            />
          </div>
          <div class="pref-row">
            <ToggleSwitch
              :model-value="settings.settings.compareEnabled"
              :label="tt('Compare with previous period by default', '預設與前期比較')"
              @update:model-value="(v) => settings.update({ compareEnabled: v })"
            />
          </div>
          <div class="pref-row">
            <ToggleSwitch
              :model-value="settings.settings.sidebarCollapsed"
              :label="tt('Collapsed sidebar', '收合側邊欄')"
              :description="tt('Show icons only on desktop.', '桌機版只顯示圖示。')"
              @update:model-value="(v) => settings.update({ sidebarCollapsed: v })"
            />
          </div>
        </div>
      </section>

      <!-- Notifications -->
      <section v-else-if="tab === 'notifications'" class="card settings-card">
        <h2 class="card__title">{{ tt('Notification preferences', '通知偏好') }}</h2>
        <p class="card__subtitle">
          {{
            tt(
              'Demo only — no emails or push messages are actually sent.',
              '僅供展示，不會實際寄送 Email 或推播。',
            )
          }}
        </p>
        <div class="pref-list">
          <ToggleSwitch
            v-model="settings.settings.notifications.email"
            :label="tt('Email notifications', 'Email 通知')"
            :description="tt('Summaries and alerts to your inbox.', '摘要與警示寄到你的信箱。')"
          />
          <ToggleSwitch
            v-model="settings.settings.notifications.push"
            :label="tt('Browser push notifications', '瀏覽器推播通知')"
          />
          <ToggleSwitch
            v-model="settings.settings.notifications.weeklyDigest"
            :label="tt('Weekly digest', '每週摘要')"
            :description="tt('Every Monday at 09:00.', '每週一 09:00。')"
          />
          <ToggleSwitch
            v-model="settings.settings.notifications.anomalyAlerts"
            :label="tt('Anomaly alerts', '異常警示')"
            :description="
              tt(
                'When revenue or refunds change by more than 10% day over day.',
                '營收或退款日變動超過 10% 時通知。',
              )
            "
          />
          <ToggleSwitch
            v-model="settings.settings.notifications.reportReady"
            :label="tt('Scheduled report ready', '排程報表完成')"
          />
        </div>
      </section>

      <!-- System -->
      <section v-else class="settings-system">
        <div class="card">
          <h2 class="card__title">{{ tt('System information', '系統資訊') }}</h2>
          <dl class="sys-list">
            <div>
              <dt>{{ tt('Application', '應用程式') }}</dt>
              <dd>Insightra v{{ config.public.appVersion }}</dd>
            </div>
            <div>
              <dt>{{ tt('Build time', '建置時間') }}</dt>
              <dd>{{ formatLongDate(config.public.buildTime.slice(0, 10)) }}</dd>
            </div>
            <div>
              <dt>{{ tt('Framework', '技術框架') }}</dt>
              <dd>Nuxt 3 · Vue 3 · TypeScript · Pinia · ECharts</dd>
            </div>
            <div>
              <dt>{{ tt('Rendering', '渲染方式') }}</dt>
              <dd>
                {{ tt('Client-side (SPA) + Nitro mock REST API', '用戶端渲染（SPA）＋ Nitro 模擬 REST API') }}
              </dd>
            </div>
            <div>
              <dt>{{ tt('Data source', '資料來源') }}</dt>
              <dd>
                {{ tt('Mock API —', '模擬 API —') }} <b>{{ tt('simulated data', '模擬資料') }}</b>{{
                  tt(', not real business data', '，並非真實商業資料')
                }}
              </dd>
            </div>
            <div v-if="meta">
              <dt>{{ tt('Dataset window', '資料期間') }}</dt>
              <dd>{{ formatLongDate(meta.firstDate) }} – {{ formatLongDate(meta.lastDate) }}</dd>
            </div>
            <div v-if="meta">
              <dt>{{ tt('Dataset size', '資料規模') }}</dt>
              <dd>
                {{
                  tt('{o} orders · {c} customers · {p} products', '{o} 筆訂單 · {c} 位顧客 · {p} 項商品', {
                    o: formatNumber(meta.orders),
                    c: formatNumber(meta.customers),
                    p: meta.products,
                  })
                }}
              </dd>
            </div>
            <div>
              <dt>{{ tt('Local storage used', '本機儲存用量') }}</dt>
              <dd>{{ storageSize }}</dd>
            </div>
          </dl>
        </div>
        <div class="card danger-zone">
          <h2 class="card__title">{{ tt('Reset', '重設') }}</h2>
          <p class="card__subtitle">
            {{
              tt('Everything personal is stored only in this browser.', '所有個人資料都只儲存在此瀏覽器。')
            }}
          </p>
          <div class="danger-zone__actions">
            <BaseButton icon="layout" @click="resetDashboards">{{
              tt('Reset dashboards', '重設儀表板')
            }}</BaseButton>
            <BaseButton variant="danger" icon="trash" @click="resetAll">{{
              tt('Reset all local data', '重設所有本機資料')
            }}</BaseButton>
          </div>
        </div>
      </section>
    </BaseTabs>
  </div>
</template>

<style scoped lang="scss">
.settings-card {
  max-width: 760px;
}

.settings-form {
  display: grid;
  gap: space(4);
  margin-top: space(4);

  @include up('md') {
    grid-template-columns: 1fr 1fr;
  }

  &__actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }
}

.pref-list {
  display: grid;
  gap: space(5);
  margin-top: space(5);
}

.pref-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: space(3);

  > :deep(.switch-row) {
    width: 100%;
  }

  p {
    font-size: fs('sm');
    color: var(--color-text-muted);
  }
}

.settings-system {
  display: grid;
  gap: space(4);
  max-width: 760px;
}

.sys-list {
  display: grid;
  gap: space(3);
  margin: space(4) 0 0;

  div {
    display: grid;
    gap: space(1);

    @include up('sm') {
      grid-template-columns: 180px 1fr;
    }
  }

  dt {
    color: var(--color-text-muted);
    font-size: fs('sm');
  }

  dd {
    margin: 0;
  }
}

.danger-zone {
  border-color: var(--color-danger-soft);

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: space(2);
    margin-top: space(4);
  }
}
</style>
