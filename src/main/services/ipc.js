import { app, ipcMain, clipboard, shell, dialog, BrowserWindow } from 'electron'
import { store, settingsSnapshot } from './store.js'
import { readSupportedGlyphs, writeSupportedGlyphs, clearSupportedGlyphs } from './db.js'
import { applyThemePreference, isDarkMode } from './theme.js'
import { updateLoginItem } from './login-item.js'
import { lookupShortcut } from './keymap.js'
import { hideWindow, registerShortcut, isMenubarMode } from './window.js'

const WRITABLE_SETTINGS = new Set([
  'shortcut', 'showMenubar', 'autoStart', 'hideAfterCopy', 'clearSearchOnHide', 'expanded', 'usage', 'darkMode',
])

function broadcast(channel, ...args) {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, ...args)
  }
}

export function registerIpc() {
  ipcMain.on('app:info', event => {
    event.returnValue = {
      version: app.getVersion(),
      platform: process.platform,
      osVersion: process.getSystemVersion(),
      isDarkMode: isDarkMode(),
      isMenubar: isMenubarMode(),
      isDev: !app.isPackaged,
    }
  })

  ipcMain.on('settings:all', event => {
    event.returnValue = settingsSnapshot()
  })

  ipcMain.on('settings:set', (_, key, value) => {
    if (!WRITABLE_SETTINGS.has(key)) return

    store.set(key, value)

    if (key === 'darkMode') applyThemePreference()
    if (key === 'autoStart') updateLoginItem()
    if (key === 'shortcut' && isMenubarMode()) registerShortcut()

    broadcast('settings:changed', key, value)
  })

  // Returns whether macOS accepted the accelerator, so the UI can fall back to the previous one.
  ipcMain.handle('shortcut:set', (_, keys) => {
    if (!Array.isArray(keys) || !keys.every(key => typeof key === 'string')) return false
    store.set('shortcut', keys)
    broadcast('settings:changed', 'shortcut', keys)
    return isMenubarMode() ? registerShortcut() : true
  })

  ipcMain.on('app:hide', () => hideWindow())

  ipcMain.on('app:relaunch', () => {
    app.relaunch()
    app.exit(0)
  })

  ipcMain.on('app:open-external', (_, url) => {
    if (typeof url === 'string' && /^(https:|mailto:)/.test(url)) shell.openExternal(url)
  })

  ipcMain.on('clipboard:write', (_, text) => {
    if (typeof text === 'string') clipboard.writeText(text)
  })

  ipcMain.handle('dialog:confirm', async (event, { message, detail, confirmLabel = 'OK' }) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const { response } = await dialog.showMessageBox(win, {
      type: 'question',
      message,
      detail,
      buttons: [confirmLabel, 'Cancel'],
      defaultId: 0,
      cancelId: 1,
    })
    return response === 0
  })

  ipcMain.handle('glyph-cache:read', (_, meta) => readSupportedGlyphs(meta))
  ipcMain.on('glyph-cache:write', (_, meta, symbols) => writeSupportedGlyphs(meta, symbols))
  ipcMain.handle('glyph-cache:clear', () => clearSupportedGlyphs())

  ipcMain.handle('keymap:lookup', (_, symbol) => lookupShortcut(symbol))
}
