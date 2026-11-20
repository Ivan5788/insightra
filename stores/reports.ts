import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportsService, type NewReport } from '~/services/reports.service'
import type { ReportDefinition } from '~/types/app'

export const useReportsStore = defineStore('reports', () => {
  const reports = ref<ReportDefinition[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return
    loading.value = true
    try {
      reports.value = await reportsService.list()
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function create(input: NewReport, owner: string): Promise<ReportDefinition> {
    const report = await reportsService.create(input, owner)
    reports.value = [report, ...reports.value]
    return report
  }

  async function remove(ids: string[]): Promise<void> {
    await reportsService.remove(ids)
    reports.value = reports.value.filter((r) => !ids.includes(r.id))
  }

  return { reports, loading, loaded, load, create, remove }
})
