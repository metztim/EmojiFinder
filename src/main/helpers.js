import { join } from 'node:path'
import { app } from 'electron'

export const isMac = process.platform === 'darwin'

export const isDev = !app.isPackaged

// Static files shipped next to the app bundle (tray icons). In development they are read from
// the repository; in the packaged app electron-builder copies them to Contents/Resources/resources.
export function resourcePath(...segments) {
  const base = isDev ? join(app.getAppPath(), 'resources') : join(process.resourcesPath, 'resources')
  return join(base, ...segments)
}

export function nestedValue(object, keyPath) {
  try {
    return keyPath.split('.').reduce((value, key) => value[key], object)
  } catch {
    return null
  }
}
