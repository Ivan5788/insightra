/**
 * Global route guard (mock auth).
 * Pages declare `definePageMeta({ public: true })` to be reachable without login.
 * NOTE: client-side guards are UX only — a real API must also check the session.
 */
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  const isPublic = to.meta.public === true

  if (!isPublic && !auth.isAuthenticated) {
    return navigateTo({ path: '/auth/login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} })
  }
  if (to.path.startsWith('/auth') && auth.isAuthenticated) {
    return navigateTo('/')
  }
})
