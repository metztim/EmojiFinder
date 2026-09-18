import { reactive, readonly } from 'vue'
import { api } from '@/services/api'

// One reactive copy of the settings for the whole renderer. Writes go to the main process,
// which persists them and echoes the change back on 'settings:changed'.
const state = reactive(api.settings.all())

api.on('settings:changed', (key, value) => {
  state[key] = value
})

export function setSetting(key, value) {
  state[key] = value
  api.settings.set(key, value)
}

export function recordUsage(symbol) {
  const usage = Array.isArray(state.usage) ? state.usage : []
  const existing = usage.find(item => item.symbol === symbol)
  const next = [
    ...usage.filter(item => item.symbol !== symbol),
    { symbol, count: (existing ? existing.count : 0) + 1 },
  ]
  setSetting('usage', next)
}

export function useSettings() {
  return {
    settings: readonly(state),
    setSetting,
    recordUsage,
  }
}
