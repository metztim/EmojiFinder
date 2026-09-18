import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow, globalShortcut, nativeImage } from 'electron'
import { menubar } from 'menubar'
import { store } from './store.js'
import { isDarkMode } from './theme.js'
import { trayContextMenu } from './menu.js'
import { resourcePath } from '../helpers.js'

const WIDTH = 340
const HEIGHT = 580

let menubarInstance = null
let standaloneWindow = null

const rendererUrl = () => process.env.ELECTRON_RENDERER_URL
  || pathToFileURL(join(import.meta.dirname, '../renderer/index.html')).href

function windowOptions() {
  return {
    title: 'EmojiFinder',
    width: WIDTH,
    height: HEIGHT,
    resizable: false,
    fullscreenable: false,
    frame: false,
    show: false,
    transparent: true,
    backgroundColor: isDarkMode() ? '#000000' : '#F3F3F3',
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false, // keep repainting while hidden so the window shows instantly
    },
  }
}

function trayIcon() {
  const image = nativeImage.createFromPath(resourcePath('MenuIconTemplate.png'))
  image.setTemplateImage(true)
  return image
}

export function currentWindow() {
  return menubarInstance ? menubarInstance.window : standaloneWindow
}

export function isMenubarMode() {
  return Boolean(menubarInstance)
}

export function hideWindow() {
  if (menubarInstance) {
    menubarInstance.hideWindow()
  } else {
    app.hide()
  }
}

export function showWindow() {
  if (menubarInstance) {
    menubarInstance.showWindow()
  } else if (standaloneWindow) {
    standaloneWindow.show()
  }
}

function wireWindow(win) {
  win.on('hide', () => win.webContents.send('window:hidden'))
  win.on('closed', () => {
    if (standaloneWindow === win) standaloneWindow = null
  })
}

export function registerShortcut() {
  globalShortcut.unregisterAll()

  const shortcut = store.get('shortcut')
  if (!Array.isArray(shortcut) || !shortcut.length) return false

  const accelerator = shortcut.join('+')
  const registered = globalShortcut.register(accelerator, () => {
    const win = currentWindow()
    if (win && !win.isDestroyed() && win.isVisible()) {
      hideWindow()
    } else {
      showWindow()
    }
  })

  if (!registered) console.error(`Could not register the global shortcut ${accelerator}`)
  return registered
}

export function createMenubarWindow() {
  return new Promise(resolve => {
    menubarInstance = menubar({
      index: rendererUrl(),
      icon: trayIcon(),
      tooltip: 'EmojiFinder',
      preloadWindow: true,
      showDockIcon: false,
      browserWindow: { ...windowOptions(), movable: false },
    })

    menubarInstance.on('after-create-window', () => {
      const win = menubarInstance.window
      wireWindow(win)

      menubarInstance.tray.on('right-click', () => {
        menubarInstance.tray.popUpContextMenu(trayContextMenu({ onQuit: () => app.quit() }))
      })

      resolve(win)
    })

    menubarInstance.on('ready', () => {
      registerShortcut()
    })
  })
}

export function createStandaloneWindow() {
  standaloneWindow = new BrowserWindow({
    ...windowOptions(),
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 24 },
  })

  wireWindow(standaloneWindow)
  standaloneWindow.loadURL(rendererUrl())
  standaloneWindow.once('ready-to-show', () => standaloneWindow.show())

  return standaloneWindow
}
