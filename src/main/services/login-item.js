import { app } from 'electron'
import { store } from './store.js'

export function updateLoginItem() {
  // Only the packaged app can register itself as a login item.
  if (!app.isPackaged) return

  app.setLoginItemSettings({
    openAtLogin: Boolean(store.get('autoStart')),
    openAsHidden: true,
  })
}
