import { createRouter, createWebHistory } from 'vue-router'
import { defineAsyncComponent } from 'vue'
import { useModelsStore } from '@/stores/models'

// Lazy load components for better performance
const LandingPage = defineAsyncComponent({
  loader: () => import('../views/LandingPage.vue'),
  loadingComponent: () => import('../components/shared/LoadingSpinner.vue'),
  errorComponent: () => import('../components/shared/ErrorBoundary.vue'),
  delay: 200,
  timeout: 3000,
})

const ChatView = defineAsyncComponent({
  loader: () => import('../views/ChatView.vue'),
  loadingComponent: () => import('../components/shared/LoadingSpinner.vue'),
  errorComponent: () => import('../components/shared/ErrorBoundary.vue'),
  delay: 200,
  timeout: 3000,
})

const ModelDownloadView = defineAsyncComponent({
  loader: () => import('../views/ModelDownloadView.vue'),
  loadingComponent: () => import('../components/shared/LoadingSpinner.vue'),
  errorComponent: () => import('../components/shared/ErrorBoundary.vue'),
  delay: 200,
  timeout: 5000, // Longer timeout for model download view
})

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
      meta: {
        title: 'Yokai Chat - Landing',
        preload: true, // Preload landing page
      },
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      meta: {
        title: 'Yokai Chat - Chat',
        preload: true, // Preload chat view
      },
    },
    {
      path: '/models',
      name: 'models',
      component: ModelDownloadView,
      meta: {
        title: 'Yokai Chat - Models',
        preload: false, // Don't preload model download view
      },
    },
  ],
})

// Navigation guard: require valid LM Studio base URL for protected routes
router.beforeEach((to, _from, next) => {
  // Check if user is trying to access protected routes without a valid base URL
  if (to.name === 'chat' || to.name === 'models') {
    const modelsStore = useModelsStore()

    // Load the base URL from storage if not already loaded
    if (!modelsStore.lmStudioBaseUrl) {
      modelsStore.loadLMStudioBaseUrlFromStorage()
    }

    // Check if base URL is valid
    if (!modelsStore.isBaseUrlValid()) {
      console.warn('No valid LM Studio base URL found, redirecting to landing page')
      return next({ name: 'landing' })
    }
  }

  next()
})

// Route preloading for better performance
router.beforeEach((to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // Preload routes based on meta.preload
  if (to.meta.preload) {
    // Preload the next likely route
    const preloadRoutes = ['/chat', '/models']
    preloadRoutes.forEach((route) => {
      if (route !== to.path) {
        // Preload route components
        router.resolve(route).matched.forEach((match) => {
          if (match.components) {
            Object.values(match.components).forEach((component) => {
              if (typeof component === 'function') {
                component()
              }
            })
          }
        })
      }
    })
  }

  next()
})

// Performance monitoring for route changes
router.afterEach((to, from) => {
  // Track route change performance
  if (import.meta.env.DEV) {
    const navigationStart = performance.now()
    requestAnimationFrame(() => {
      const navigationEnd = performance.now()
      console.debug(
        `Route change from ${from.name} to ${to.name}: ${(navigationEnd - navigationStart).toFixed(2)}ms`,
      )
    })
  }
})

export default router
