import { nativeTheme, BrowserWindow } from 'electron'
import { store } from './store.js'

// The preference maps straight onto nativeTheme.themeSource, so Chromium's own
// prefers-color-scheme and the shouldUseDarkColors flag both follow it.
export function applyThemePreference() {
  const preference = store.get('darkMode')
  nativeTheme.themeSource = preference === 'dark' || preference === 'light' ? preference : 'system'
}

export const isDarkMode = () => nativeTheme.shouldUseDarkColors

export function watchTheme() {
  applyThemePreference()

  nativeTheme.on('updated', () => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('theme:changed', isDarkMode())
    }
  })
}
