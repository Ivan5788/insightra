<script setup lang="ts">
/** Reports — list, filter, create, delete (single & bulk) saved report definitions. */
import { computed, onMounted, ref } from 'vue'
import { presetLabel, REPORT_SCHEDULES, REPORT_TYPES } from '~/data/report-options'
import type { NewReport } from '~/services/reports.service'
import type { ReportDefinition, ReportType } from '~/types/app'
import type { DataColumn } from '~/types/table'
import { formatLongDate } from '~/utils/date'
import { metricInfo } from '~/utils/metrics'

const { t, tt } = useI18n()
const store = useReportsStore()
const settings = useSettingsStore()
const toast = useToast()
const { confirm } = useConfirm()

onMounted(() => store.load())

const search = ref('')
const type = ref<ReportType | ''>('')
const selected = ref<string[]>([])
const showCreate = ref(false)
const creating = ref(false)

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return store.reports.filter(
    (r) =>
      (!type.value || r.type === type.value) &&
      (!q || (r.name + ' ' + r.description).toLowerCase().includes(q)),
  )
})

const columns: DataColumn<ReportDefinition>[] = [
  { key: 'name', label: tt('Report', '報表'), required: true },
  { key: 'type', label: tt('Type', '類型') },
  {
    key: 'metrics',
    label: tt('Metrics', '指標'),
    value: (r) => r.metrics.map((m) => metricInfo(m).shortLabel).join(', '),
    hideOnMobile: true,
  },
  { key: 'preset', label: tt('Period', '期間'), value: (r) => presetLabel(r.preset) },
  {
    key: 'schedule',
    label: tt('Schedule', '排程'),
    value: (r) => REPORT_SCHEDULES.find((s) => s.value === r.schedule)?.label ?? r.schedule,
  },
  { key: 'owner', label: tt('Owner', '擁有者'), hideOnMobile: true },
  {
    key: 'updatedAt',
    label: tt('Updated', '更新時間'),
    value: (r) => formatLongDate(r.updatedAt.slice(0, 10)),
    hideOnMobile: true,
  },
  { key: 'actions', label: '', align: 'right' },
]

async function create(input: NewReport): Promise<void> {
  creating.value = true
  try {
    const report = await store.create(input, settings.settings.profile.name)
    showCreate.value = false
    toast.success(
      tt('Report created', '報表已建立'),
      tt('"{x}" is ready to view.', '「{x}」已可檢視。', { x: report.name }),
    )
    await navigateTo('/reports/' + report.id)
  } finally {
    creating.value = false
  }
}

async function remove(ids: string[]): Promise<void> {
  const ok = await confirm({
    title:
      ids.length > 1
        ? tt('Delete {n} reports?', '刪除 {n} 份報表？', { n: ids.length })
        : tt('Delete report?', '刪除報表？'),
    message: tt('This cannot be undone.', '此動作無法復原。'),
    confirmLabel: tt('Delete', '刪除'),
    danger: true,
  })
  if (!ok) return
  await store.remove(ids)
  selected.value = selected.value.filter((id) => !ids.includes(id))
  toast.success(
    ids.length > 1
      ? tt('{n} reports deleted', '已刪除 {n} 份報表', { n: ids.length })
      : tt('Report deleted', '報表已刪除'),
  )
}
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.reports.title')" :subtitle="t('page.reports.subtitle')">
      <template #actions>
        <BaseButton variant="primary" icon="plus" data-testid="create-report" @click="showCreate = true">{{
          tt('Create report', '建立報表')
        }}</BaseButton>
      </template>
    </PageHeader>

    <section class="card reports-card">
      <div class="reports-toolbar">
        <SearchInput
          v-model="search"
          :placeholder="tt('Search reports…', '搜尋報表…')"
          :label="tt('Search reports', '搜尋報表')"
          class="reports-toolbar__search"
        />
        <SelectInput
          v-model="type"
          :label="tt('Type', '類型')"
          hide-label
          :placeholder="tt('All types', '所有類型')"
          :options="REPORT_TYPES"
          class="reports-toolbar__type"
        />
      </div>

      <div v-if="selected.length" class="batch-bar">
        <b>{{ tt('{n} selected', '已選取 {n} 項', { n: selected.length }) }}</b>
        <BaseButton size="sm" variant="danger" icon="trash" @click="remove(selected)">{{
          tt('Delete selected', '刪除所選')
        }}</BaseButton>
        <BaseButton size="sm" variant="ghost" @click="selected = []">{{ tt('Clear', '清除') }}</BaseButton>
      </div>

      <DataTable
        v-model:selected="selected"
        :columns="columns"
        :rows="filtered"
        :row-key="(r) => r.id"
        :loading="store.loading"
        selectable
        :caption="tt('Saved reports', '已儲存的報表')"
        :empty-title="tt('No reports found', '找不到報表')"
        :empty-text="tt('Create a report or change the filters.', '建立新報表或調整篩選條件。')"
      >
        <template #cell-name="{ row }">
          <NuxtLink :to="'/reports/' + row.id" class="report-link">
            <b>{{ row.name }}</b>
            <span>{{ row.description }}</span>
          </NuxtLink>
        </template>
        <template #cell-type="{ row }">
          <span class="badge badge--primary">{{
            REPORT_TYPES.find((x) => x.value === row.type)?.label
          }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="row-actions">
            <BaseButton size="sm" variant="ghost" :to="'/reports/' + row.id">{{
              tt('View', '檢視')
            }}</BaseButton>
            <BaseButton
              size="sm"
              variant="ghost"
              icon="trash"
              icon-only
              :label="tt('Delete {x}', '刪除「{x}」', { x: row.name })"
              @click="remove([row.id])"
            />
          </div>
        </template>
      </DataTable>
    </section>

    <BaseModal
      :open="showCreate"
      :title="tt('Create report', '建立報表')"
      :description="tt('Choose what to measure and for which period.', '選擇要衡量的指標與期間。')"
      size="lg"
      persistent
      @close="showCreate = false"
    >
      <ReportForm v-if="showCreate" @submit="create" />
      <template #footer>
        <BaseButton @click="showCreate = false">{{ tt('Cancel', '取消') }}</BaseButton>
        <BaseButton
          variant="primary"
          type="submit"
          form="report-form"
          :loading="creating"
          data-testid="report-submit"
          >{{ tt('Create report', '建立報表') }}</BaseButton
        >
      </template>
    </BaseModal>
  </div>
</template>

<style scoped lang="scss">
.reports-card {
  display: grid;
  gap: space(4);
}

.reports-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: space(2);

  &__search {
    flex: 1 1 260px;
  }

  &__type {
    flex: 0 1 180px;
  }
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: space(2);
  padding: space(2.5) space(3);
  border-radius: $radius-md;
  background: var(--color-primary-soft);
}

.report-link {
  display: flex;
  flex-direction: column;
  max-width: min(360px, 100%);
  min-width: 0;
  white-space: normal;

  b {
    color: var(--color-text);
  }

  span {
    font-size: fs('xs');
    color: var(--color-text-muted);
    @include truncate;
  }

  &:hover b {
    color: var(--color-primary);
  }
}

.row-actions {
  display: inline-flex;
  gap: space(1);
}
</style>
