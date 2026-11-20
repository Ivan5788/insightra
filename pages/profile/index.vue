<script setup lang="ts">
import { computed, onMounted } from 'vue'

const { t, tt } = useI18n()
const settings = useSettingsStore()
const auth = useAuthStore()
const dashboards = useDashboardStore()
const reports = useReportsStore()
const flags = useOrderFlagsStore()

onMounted(() => reports.load())

const profile = computed(() => settings.settings.profile)
const initials = computed(() =>
  profile.value.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)
const ownReports = computed(() => reports.reports.filter((r) => r.owner === profile.value.name).length)
</script>

<template>
  <div class="page">
    <PageHeader :title="t('page.profile.title')" :subtitle="t('page.profile.subtitle')">
      <template #actions>
        <BaseButton icon="edit" to="/settings?tab=profile">{{
          tt('Edit profile', '編輯個人資料')
        }}</BaseButton>
      </template>
    </PageHeader>

    <div class="page-grid page-grid--wide-left">
      <section class="card profile-card">
        <span class="profile-card__avatar" aria-hidden="true">{{ initials }}</span>
        <div>
          <h2 class="profile-card__name">{{ profile.name }}</h2>
          <p class="text-muted">{{ profile.title }} · {{ profile.company }}</p>
          <dl class="profile-card__facts">
            <div>
              <dt>Email</dt>
              <dd>{{ profile.email }}</dd>
            </div>
            <div>
              <dt>{{ tt('Role', '角色') }}</dt>
              <dd>{{ auth.user?.role ?? tt('Analyst', '分析師') }}</dd>
            </div>
            <div>
              <dt>{{ tt('Time zone', '時區') }}</dt>
              <dd>{{ profile.timezone }}</dd>
            </div>
            <div>
              <dt>{{ tt('Workspace', '工作區') }}</dt>
              <dd>Aurora Living Co. {{ tt('(demo)', '（示範）') }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="card">
        <h2 class="card__title">{{ tt('Your workspace', '你的工作區') }}</h2>
        <ul class="ws-stats" role="list">
          <li>
            <b>{{ dashboards.layouts.length }}</b><span>{{ tt('Dashboards', '儀表板') }}</span>
          </li>
          <li>
            <b>{{ ownReports }}</b><span>{{ tt('Reports owned', '擁有的報表') }}</span>
          </li>
          <li>
            <b>{{ flags.count }}</b><span>{{ tt('Orders flagged', '已標記訂單') }}</span>
          </li>
        </ul>
        <div class="ws-links">
          <NuxtLink to="/">{{ tt('Open dashboards →', '開啟儀表板 →') }}</NuxtLink>
          <NuxtLink to="/reports">{{ tt('Manage reports →', '管理報表 →') }}</NuxtLink>
          <NuxtLink to="/settings?tab=preferences">{{ tt('Preferences →', '偏好設定 →') }}</NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-card {
  display: flex;
  flex-wrap: wrap;
  gap: space(5);

  &__avatar {
    display: grid;
    place-items: center;
    width: 88px;
    height: 88px;
    border-radius: $radius-full;
    background: linear-gradient(135deg, #0f6e73, #1f9e96);
    color: #fff;
    font-size: fs('2xl');
    font-weight: $font-weight-bold;
  }

  &__name {
    font-size: fs('xl');
    font-weight: $font-weight-bold;
  }

  &__facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: space(3) space(6);
    margin: space(5) 0 0;

    dt {
      font-size: fs('xs');
      color: var(--color-text-muted);
    }

    dd {
      margin: 0;
      font-weight: $font-weight-medium;
    }
  }
}

.ws-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: space(3);
  margin: space(4) 0;
  padding: 0;

  li {
    display: flex;
    flex-direction: column;
    padding: space(3);
    border-radius: $radius-md;
    background: var(--color-surface-2);
    text-align: center;
  }

  b {
    font-size: fs('xl');
  }

  span {
    font-size: fs('xs');
    color: var(--color-text-muted);
  }
}

.ws-links {
  display: grid;
  gap: space(2);
  font-size: fs('sm');
}
</style>
