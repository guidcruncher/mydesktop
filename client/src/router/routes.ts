import Home from '../views/Home.vue'
import Config from '../views/Config.vue'
import Icons from '../views/Icons.vue'

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
  {
    path: '/icons',
    name: 'Icons',
    component: Icons,
  },
]
