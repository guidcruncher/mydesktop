import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import router from './router' // Import the router
import { UseGlassUi } from './components/'

const app = createApp(App)

UseGlassUi(app)
app.use(router)
app.mount('#app')
