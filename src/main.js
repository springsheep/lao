import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/css/global.css'
import MobileAdapter from './utils/MobileAdapter'

// 初始化移动端适配
MobileAdapter.init()

const app = createApp(App)
app.use(router)
app.mount('#app')
