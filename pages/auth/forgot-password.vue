<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '~/services/auth.service'
import { ApiError } from '~/services/errors'

const { tt } = useI18n()

definePageMeta({ layout: 'auth', public: true })
useHead({ title: tt('Reset password', '重設密碼') + ' · Insightra' })

const email = ref('')
const loading = ref(false)
const message = ref<string | null>(null)
const error = ref<string | null>(null)

async function submit(): Promise<void> {
  error.value = null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    error.value = tt('Enter a valid email address.', '請輸入有效的 Email。')
    return
  }
  loading.value = true
  try {
    await authService.forgotPassword(email.value)
    // Same text as the API, shown in the UI language.
    message.value = tt(
      'If an account exists for this email, a reset link has been sent. (Demo: no email is actually sent.)',
      '若此 Email 有對應帳號，重設連結已寄出。（展示用：不會實際寄送 Email。）',
    )
  } catch (e) {
    error.value =
      e instanceof ApiError && e.status === 0
        ? e.message
        : tt('Request failed. Please try again.', '請求失敗，請再試一次。')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-form">
    <div>
      <h1 class="auth-form__title">{{ tt('Reset your password', '重設密碼') }}</h1>
      <p class="auth-form__subtitle">
        {{
          tt(
            "Enter your account email and we'll send you a reset link.",
            '輸入帳號 Email，我們會寄送重設連結給你。',
          )
        }}
      </p>
    </div>

    <div v-if="message" class="auth-form__success" role="status">
      <AppIcon name="check-circle" :size="18" />
      <p>{{ message }}</p>
    </div>

    <form v-else class="auth-form__fields" novalidate @submit.prevent="submit">
      <div class="field">
        <label for="reset-email" class="field__label">Email</label>
        <input
          id="reset-email"
          v-model="email"
          type="email"
          class="input"
          autocomplete="email"
          :aria-invalid="!!error"
          :aria-describedby="error ? 'reset-error' : undefined"
          placeholder="you@company.com"
        />
        <p v-if="error" id="reset-error" class="field__error" role="alert">{{ error }}</p>
      </div>
      <BaseButton type="submit" variant="primary" size="lg" block :loading="loading">{{
        tt('Send reset link', '寄送重設連結')
      }}</BaseButton>
    </form>

    <NuxtLink to="/auth/login" class="auth-form__back"
      ><AppIcon name="arrow-left" :size="16" /> {{ tt('Back to sign in', '返回登入') }}</NuxtLink
    >
  </div>
</template>

<style scoped lang="scss">
.auth-form {
  display: flex;
  flex-direction: column;
  gap: space(6);

  &__title {
    font-size: fs('2xl');
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
  }

  &__subtitle {
    margin-top: space(1);
    color: var(--color-text-muted);
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: space(4);
  }

  &__success {
    display: flex;
    gap: space(3);
    padding: space(4);
    border-radius: $radius-md;
    background: var(--color-success-soft);
    color: var(--color-success);
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: space(2);
    font-size: fs('sm');
  }
}
</style>
