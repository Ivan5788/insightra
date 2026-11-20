<script setup lang="ts">
import { ref } from 'vue'
import { ApiError } from '~/services/errors'

const { tt } = useI18n()

definePageMeta({ layout: 'auth', public: true })
useHead({ title: tt('Sign in', '登入') + ' · Insightra' })

const auth = useAuthStore()
const route = useRoute()

const email = ref('demo@insightra.app')
const password = ref('insightra2026')
const showPassword = ref(false)
const remember = ref(true)
const loading = ref(false)
const error = ref<string | null>(null)
const fieldErrors = ref<{ email?: string; password?: string }>({})

function validate(): boolean {
  fieldErrors.value = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
    fieldErrors.value.email = tt('Enter a valid email address.', '請輸入有效的 Email。')
  if (password.value.length < 8)
    fieldErrors.value.password = tt('Password must be at least 8 characters.', '密碼至少需要 8 個字元。')
  return Object.keys(fieldErrors.value).length === 0
}

async function submit(): Promise<void> {
  error.value = null
  if (!validate()) return
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/'
    await navigateTo(redirect)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      error.value = tt('Incorrect email or password.', 'Email 或密碼錯誤。')
    } else if (e instanceof ApiError && e.status === 0) {
      error.value = e.message
    } else {
      error.value = tt('Sign in failed. Please try again.', '登入失敗，請再試一次。')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-form">
    <div>
      <h1 class="auth-form__title">{{ tt('Welcome back', '歡迎回來') }}</h1>
      <p class="auth-form__subtitle">
        {{ tt('Sign in to your analytics workspace.', '登入你的數據分析工作區。') }}
      </p>
    </div>

    <div class="auth-form__demo" role="note">
      <AppIcon name="info" :size="16" />
      <span
        >{{ tt('Demo account is pre-filled:', '已預填示範帳號：') }} <b>demo@insightra.app</b> /
        <b>insightra2026</b></span
      >
    </div>

    <form class="auth-form__fields" novalidate @submit.prevent="submit">
      <p v-if="error" class="auth-form__error" role="alert">
        <AppIcon name="alert-circle" :size="16" /> {{ error }}
      </p>

      <div class="field">
        <label for="email" class="field__label">{{ tt('Email', 'Email') }}</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="input"
          autocomplete="email"
          :aria-invalid="!!fieldErrors.email"
          :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
          required
        />
        <p v-if="fieldErrors.email" id="email-error" class="field__error">{{ fieldErrors.email }}</p>
      </div>

      <div class="field">
        <div class="auth-form__row">
          <label for="password" class="field__label">{{ tt('Password', '密碼') }}</label>
          <NuxtLink to="/auth/forgot-password" class="auth-form__link">{{
            tt('Forgot password?', '忘記密碼？')
          }}</NuxtLink>
        </div>
        <div class="auth-form__pw">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="input"
            autocomplete="current-password"
            :aria-invalid="!!fieldErrors.password"
            :aria-describedby="fieldErrors.password ? 'password-error' : undefined"
            required
          />
          <button
            type="button"
            class="auth-form__eye"
            :aria-label="showPassword ? tt('Hide password', '隱藏密碼') : tt('Show password', '顯示密碼')"
            :aria-pressed="showPassword"
            @click="showPassword = !showPassword"
          >
            <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="16" />
          </button>
        </div>
        <p v-if="fieldErrors.password" id="password-error" class="field__error">{{ fieldErrors.password }}</p>
      </div>

      <label class="auth-form__remember">
        <input v-model="remember" type="checkbox" class="checkbox" />
        {{ tt('Keep me signed in', '保持登入') }}
      </label>

      <BaseButton
        type="submit"
        variant="primary"
        size="lg"
        block
        :loading="loading"
        data-testid="login-submit"
      >
        {{ tt('Sign in', '登入') }}
      </BaseButton>
    </form>
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

  &__demo {
    display: flex;
    gap: space(2);
    padding: space(3);
    border-radius: $radius-md;
    background: var(--color-info-soft);
    color: var(--color-info);
    font-size: fs('sm');
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: space(4);
  }

  &__error {
    display: flex;
    align-items: center;
    gap: space(2);
    padding: space(3);
    border-radius: $radius-md;
    background: var(--color-danger-soft);
    color: var(--color-danger);
    font-size: fs('sm');
  }

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__link {
    font-size: fs('sm');
  }

  &__pw {
    position: relative;

    .input {
      padding-right: space(11);
    }
  }

  &__eye {
    @include reset-button;
    position: absolute;
    right: space(1);
    top: 50%;
    transform: translateY(-50%);
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: $radius-sm;
    color: var(--color-text-muted);
    @include focus-ring(0);
  }

  &__remember {
    display: flex;
    align-items: center;
    gap: space(2);
    font-size: fs('sm');
    cursor: pointer;
  }
}
</style>
