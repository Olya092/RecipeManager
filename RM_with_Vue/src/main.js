import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import axios from 'axios'

import App from './App.vue'
import router from './router'

//axios.defaults.baseURL = 'http://localhost:3000'
axios.defaults.baseURL == "https://recipe-manager-37ph.onrender.com" // for deployment

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize auth store and check for existing authentication
const authStore = useAuthStore()
authStore.checkAuth()

app.mount('#app')
