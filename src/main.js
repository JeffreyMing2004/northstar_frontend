import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'
import NsIcon from './components/NsIcon.vue'

const app = createApp(App)
app.use(router)
app.component('NsIcon', NsIcon)
app.mount('#app')