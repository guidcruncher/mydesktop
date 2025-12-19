import Home from '../views/Home.vue'
import Config from '../views/Config.vue'

export const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/config',
    name: 'Config',
    component: Config,
  },
]
