import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import router from './router' // Import the router
import { UseGlassUi } from './components/'

const app = createApp(App)

UseGlassUi(app)
app.use(router)

fetch(import.meta.env.BASE_URL + 'config.json')
  .then((response) => response.json())
  .then((config) => {
    for (const key in config) {
      app.provide(key, config[key])
    }
    app.mount('#app')
  })
