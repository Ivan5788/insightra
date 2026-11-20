<script setup lang="ts">
import type { NuxtError } from '#app'

const { tt } = useI18n()

/** Global error page (404 and unexpected errors). */
const props = defineProps<{ error: NuxtError }>()

const is404 = props.error.statusCode === 404
useHead({ title: (is404 ? tt('Page not found', '找不到頁面') : tt('Error', '發生錯誤')) + ' · Insightra' })

function goHome(): void {
  clearError({ redirect: '/' })
}
</script>

<template>
  <main class="error-page">
    <AppLogo :size="36" />
    <p class="error-page__code">{{ error.statusCode }}</p>
    <h1 class="error-page__title">
      {{ is404 ? tt('Page not found', '找不到頁面') : tt('Something went wrong', '發生了一些問題') }}
    </h1>
    <p class="error-page__text">
      {{
        is404
          ? tt(
              'The page you are looking for does not exist or has been moved.',
              '你要找的頁面不存在或已被移動。',
            )
          : tt('An unexpected error occurred. Please try again.', '發生未預期的錯誤，請再試一次。')
      }}
    </p>
    <div class="error-page__actions">
      <button type="button" class="btn btn--primary" @click="goHome">
        {{ tt('Back to dashboard', '回到儀表板') }}
      </button>
    </div>
  </main>
</template>

<style scoped lang="scss">
.error-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: space(3);
  min-height: 100vh;
  padding: space(6);
  text-align: center;

  &__code {
    margin-top: space(6);
    font-size: 72px;
    font-weight: $font-weight-bold;
    line-height: 1;
    letter-spacing: -0.04em;
    background: linear-gradient(135deg, #0f6e73, #1f9e96);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__title {
    font-size: fs('xl');
    font-weight: $font-weight-bold;
  }

  &__text {
    max-width: 420px;
    color: var(--color-text-muted);
  }

  &__actions {
    margin-top: space(3);
  }
}
</style>
