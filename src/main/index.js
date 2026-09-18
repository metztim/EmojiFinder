import { app, BrowserWindow, globalShortcut } from 'electron'
import { importLegacySettings } from './services/legacy.js'

// A separate settings directory for development runs, so a dev session never touches the
// real EmojiFinder settings.
if (process.env.EMOJIFINDER_USER_DATA) {
  app.setPath('userData', process.env.EMOJIFINDER_USER_DATA)
}

// First launch: carry over preferences and usage history from an existing Glyphfinder install.
importLegacySettings(app.getPath('userData'), app.getPath('appData'))

// Loaded after the userData path is final; the settings store reads it when it is created.
const [{ store }, { watchTheme }, { watchKeymap }, { updateLoginItem }, { setApplicationMenu }, { registerIpc }, windows, debug] = await Promise.all([
  import('./services/store.js'),
  import('./services/theme.js'),
  import('./services/keymap.js'),
  import('./services/login-item.js'),
  import('./services/menu.js'),
  import('./services/ipc.js'),
  import('./services/window.js'),
  import('./services/debug.js'),
])

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => windows.showWindow())

  app.whenReady().then(async () => {
    watchTheme()
    watchKeymap()
    updateLoginItem()
    setApplicationMenu()
    registerIpc()

    const win = store.get('showMenubar')
      ? await windows.createMenubarWindow()
      : windows.createStandaloneWindow()

    const actions = debug.debugActions()
    if (actions) debug.runDebugActions(win, actions, { show: () => windows.showWindow() })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windows.createStandaloneWindow()
    } else {
      windows.showWindow()
    }
  })

  app.on('window-all-closed', () => {
    // A menu bar app keeps running without windows; a standalone window quits the app on close.
    if (!windows.isMenubarMode()) app.quit()
  })

  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  })
}
