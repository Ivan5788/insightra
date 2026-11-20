// https://nuxt.com/docs/api/configuration/nuxt-config
import pkg from './package.json'

/**
 * Inline script executed before Vue mounts.
 * It applies the saved theme to <html data-theme> so the page never
 * "flashes" the wrong theme on load (FOUC prevention).
 */
const themeInitScript = `(function(){try{var raw=localStorage.getItem('insightra:settings:v1');var mode=raw?JSON.parse(raw).theme:'system';var dark=mode==='dark'||(mode!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  /**
   * Rendering strategy: SPA (client-side rendering).
   * - Every page sits behind a (mock) login, so SEO brings no value.
   * - Charts (ECharts / canvas) and personalisation (localStorage) only exist in the browser.
   * - Avoids hydration mismatches between server HTML and user-specific client state.
   * The Nitro server is still used for the mock REST API under /server/api.
   * See docs/SYSTEM_ARCHITECTURE.md → "SSR vs CSR".
   */
  ssr: false,

  devtools: { enabled: false },

  modules: ['@pinia/nuxt', '@nuxt/eslint'],

  css: ['~/assets/scss/main.scss'],

  components: [{ path: '~/components', pathPrefix: false }],

  imports: {
    dirs: ['stores'],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-Hant-TW' },
      title: 'Insightra — 電商數據分析',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Insightra is a business intelligence dashboard for e-commerce teams (portfolio demo with mock data).',
        },
        { name: 'theme-color', content: '#0f6e73' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
      script: [{ innerHTML: themeInitScript, tagPosition: 'head' }],
    },
  },

  runtimeConfig: {
    public: {
      /** Base URL of the REST API. Empty = same origin (the bundled Nitro mock API). */
      apiBase: '',
      appVersion: pkg.version,
      buildTime: new Date().toISOString(),
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Make variables / mixins available in every <style lang="scss"> block.
          // The abstracts layer outputs no CSS, so it is safe to inject everywhere.
          additionalData: '@use "~/assets/scss/abstracts" as *;\n',
        },
      },
    },
    optimizeDeps: {
      include: [
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'echarts/features',
        'vuedraggable',
        'zod',
      ],
    },
  },

  typescript: {
    strict: true,
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },
})
