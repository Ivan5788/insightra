<script setup lang="ts">
/**
 * DrillDownPanel — the global drill-down drawer.
 *
 *   drill store (stack of levels) ──current level──► GET /api/drilldown ──► DrillDownView
 *
 * The user always sees: breadcrumb (path), level indicator, back button,
 * and the current filters inside the view.
 */
import { computed, useId } from 'vue'
import { drilldownService } from '~/services/drilldown.service'
import type { DrillLevel } from '~/types/drilldown'

const { tt } = useI18n()

const drill = useDrillStore()
const titleId = 'drill-title-' + useId()

const query = useApiQuery(
  () => (drill.open && drill.current ? 'drill:' + JSON.stringify(drill.current) : null),
  () => drilldownService.view(drill.current!),
  { ttl: 120_000 },
)

const crumbs = computed(() => drill.stack.map((l) => ({ label: l.label })))
// Show the view that belongs to the current level (avoid flashing the old level).
const view = computed(() =>
  query.data.value && query.data.value.kind === drill.current?.kind ? query.data.value : null,
)

function onDrill(level: DrillLevel): void {
  drill.push(level)
}
</script>

<template>
  <BaseDrawer :open="drill.open" :labelled-by="titleId" width="880px" @close="drill.close()">
    <template #header>
      <div class="drill-head">
        <div class="drill-head__top">
          <BaseButton
            v-if="drill.canGoBack"
            size="sm"
            variant="ghost"
            icon="arrow-left"
            data-testid="drill-back"
            @click="drill.back()"
          >
            {{ tt('Back', '返回') }}
          </BaseButton>
          <span class="drill-head__level">{{
            tt('Level {n} · Drill-down', '第 {n} 層 · 資料鑽取', { n: drill.depth })
          }}</span>
        </div>
        <h2 :id="titleId" class="drill-head__title">{{ view?.title ?? drill.current?.label }}</h2>
        <p v-if="view?.subtitle" class="drill-head__subtitle">{{ view.subtitle }}</p>
        <Breadcrumb
          :items="crumbs"
          :label="tt('Drill-down path', '鑽取路徑')"
          class="drill-head__crumbs"
          @navigate="drill.goTo"
        />
      </div>
    </template>

    <div class="drill-body">
      <ErrorState v-if="query.error.value" :message="query.error.value.message" @retry="query.refresh()" />
      <div v-else-if="!view" class="drill-body__loading">
        <div class="drill-body__kpis">
          <SkeletonBlock v-for="i in 4" :key="i" height="64px" radius="12px" />
        </div>
        <SkeletonBlock height="280px" radius="12px" />
        <SkeletonBlock height="200px" radius="12px" />
      </div>
      <DrillDownView v-else :view="view" @drill="onDrill" />
    </div>
  </BaseDrawer>
</template>

<style scoped lang="scss">
.drill-head {
  display: grid;
  gap: space(1);
  min-width: 0;

  &__top {
    display: flex;
    align-items: center;
    gap: space(2);
    min-height: 30px;
  }

  &__level {
    font-size: fs('xs');
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-primary);
  }

  &__title {
    font-size: fs('lg');
    font-weight: $font-weight-bold;

    @include up('md') {
      font-size: fs('xl');
    }
  }

  &__subtitle {
    font-size: fs('sm');
    color: var(--color-text-muted);
  }

  &__crumbs {
    margin-top: space(1);
  }
}

.drill-body {
  padding: space(4);

  @include up('md') {
    padding: space(5) space(6);
  }

  &__loading {
    display: grid;
    gap: space(4);
  }

  &__kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: space(3);
  }
}
</style>
