// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import prettier from 'eslint-config-prettier'

export default withNuxt(
  {
    ignores: ['.output/**', '.nuxt/**', 'playwright-report/**', 'test-results/**', 'design/**'],
  },
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  // Must be last: turns off rules that conflict with Prettier formatting.
  prettier,
)
