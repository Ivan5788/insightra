// Extend Nuxt's page meta with our own flag (used by middleware/auth.global.ts).
declare module '#app' {
  interface PageMeta {
    public?: boolean
  }
}

export {}
