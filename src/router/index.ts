import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import ChatView from '../views/ChatView.vue'
import ModelDownloadView from '../views/ModelDownloadView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
    },
    {
      path: '/models',
      name: 'models',
      component: ModelDownloadView,
    },
  ],
})

export default router
