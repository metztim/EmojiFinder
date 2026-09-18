import { createApp } from 'vue'
import App from './App.vue'
import { api, info } from './services/api'
import './styles/fonts.scss'
import './styles/theme.scss'
import './styles/base.scss'
import './styles/animations.scss'

const root = document.documentElement

function applyDarkMode(isDarkMode) {
  root.classList.toggle('is-dark-mode', Boolean(isDarkMode))
}

root.classList.add('is-mac')
root.classList.toggle('is-menubar', info.isMenubar)
applyDarkMode(info.isDarkMode)
api.on('theme:changed', applyDarkMode)

createApp(App).mount('#app')
