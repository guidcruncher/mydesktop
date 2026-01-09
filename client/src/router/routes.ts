import Home from '../views/Home.vue'
import Config from '../views/Config.vue'
import Icons from '../views/Icons.vue'
import Controls from '../views/Controls.vue'

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
  {
    path: '/controls',
    name: 'Controls',
    component: Controls,
  },
]
