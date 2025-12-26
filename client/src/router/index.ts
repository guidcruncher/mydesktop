import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
})

export default router
