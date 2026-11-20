<script setup lang="ts">
const { tt } = useI18n()
/** Split layout for login / forgot password: form on the left, product story on the right. */
</script>

<template>
  <div class="auth-layout">
    <main class="auth-layout__form">
      <div class="auth-layout__inner">
        <AppLogo :size="36" />
        <slot />
      </div>
      <p class="auth-layout__legal">
        © 2026 Insightra · {{ tt('Portfolio demo · All data is simulated', '作品集展示 · 所有資料皆為模擬') }}
      </p>
    </main>
    <aside class="auth-layout__aside" aria-hidden="true">
      <div class="auth-layout__story">
        <p class="auth-layout__eyebrow">{{ tt('E-commerce Business Intelligence', '電商商業智慧分析') }}</p>
        <h2 class="auth-layout__headline">
          {{
            tt(
              'From raw orders to clear decisions — in one dashboard.',
              '從原始訂單到清楚的決策，一個儀表板就夠。',
            )
          }}
        </h2>
        <ul class="auth-layout__points" role="list">
          <li>{{ tt('KPIs with period-over-period comparison', 'KPI 指標搭配前期比較') }}</li>
          <li>{{ tt('Drill down from monthly revenue to a single order', '從月營收一路鑽取到單筆訂單') }}</li>
          <li>{{ tt('Personal dashboards you can rearrange and save', '可自由排列並儲存的個人儀表板') }}</li>
        </ul>
        <div class="auth-layout__preview">
          <div class="auth-layout__kpi">
            <span>{{ tt('Revenue', '營收') }}</span>
            <b>$341.3K</b>
            <em>+18.9%</em>
          </div>
          <div class="auth-layout__bars">
            <span
              v-for="h in [38, 52, 44, 63, 58, 72, 66, 84, 78, 92]"
              :key="h"
              :style="{ height: h + '%' }"
            />
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped lang="scss">
.auth-layout {
  display: grid;
  min-height: 100vh;
  background: var(--color-surface);

  @include up('lg') {
    grid-template-columns: minmax(420px, 1fr) 1.1fr;
  }

  &__form {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: space(8) space(5) space(5);

    @include up('md') {
      padding: space(12) space(12) space(6);
    }
  }

  &__inner {
    display: flex;
    flex-direction: column;
    gap: space(8);
    width: 100%;
    max-width: 400px;
    margin: auto;
  }

  &__legal {
    margin-top: space(8);
    text-align: center;
    font-size: fs('xs');
    color: var(--color-text-muted);
  }

  &__aside {
    display: none;
    position: relative;
    overflow: hidden;
    background: linear-gradient(145deg, #0b3f43 0%, #0f6e73 45%, #1f9e96 100%);
    color: #fff;

    @include up('lg') {
      display: flex;
      align-items: center;
      padding: space(16);
    }
  }

  &__story {
    max-width: 520px;
  }

  &__eyebrow {
    font-size: fs('sm');
    font-weight: $font-weight-semibold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0.8;
  }

  &__headline {
    margin-top: space(3);
    font-size: fs('3xl');
    font-weight: $font-weight-bold;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  &__points {
    margin-top: space(6);
    display: grid;
    gap: space(2.5);
    opacity: 0.92;

    li::before {
      content: '✓';
      margin-right: space(2);
      font-weight: $font-weight-bold;
    }
  }

  &__preview {
    display: flex;
    gap: space(6);
    align-items: flex-end;
    margin-top: space(10);
    padding: space(6);
    border-radius: $radius-xl;
    background: rgb(255 255 255 / 0.1);
    border: 1px solid rgb(255 255 255 / 0.18);
    backdrop-filter: blur(6px);
  }

  &__kpi {
    display: flex;
    flex-direction: column;
    gap: space(1);

    span {
      font-size: fs('sm');
      opacity: 0.8;
    }

    b {
      font-size: fs('2xl');
    }

    em {
      font-style: normal;
      font-size: fs('sm');
      font-weight: $font-weight-semibold;
    }
  }

  &__bars {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 96px;

    span {
      flex: 1;
      border-radius: 4px 4px 0 0;
      background: rgb(255 255 255 / 0.7);
    }
  }
}
</style>
