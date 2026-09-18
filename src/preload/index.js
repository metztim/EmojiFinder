import { contextBridge, ipcRenderer } from 'electron'

// The only surface the renderer gets. Everything that needs Node or Electron goes through here.
const EVENT_CHANNELS = new Set(['window:hidden', 'preferences:show', 'theme:changed', 'settings:changed'])

const api = {
  info: ipcRenderer.sendSync('app:info'),

  settings: {
    all: () => ipcRenderer.sendSync('settings:all'),
    set: (key, value) => ipcRenderer.send('settings:set', key, value),
  },

  hide: () => ipcRenderer.send('app:hide'),
  relaunch: () => ipcRenderer.send('app:relaunch'),
  openExternal: url => ipcRenderer.send('app:open-external', url),
  copyText: text => ipcRenderer.send('clipboard:write', text),
  confirm: options => ipcRenderer.invoke('dialog:confirm', options),

  glyphCache: {
    read: meta => ipcRenderer.invoke('glyph-cache:read', meta),
    write: (meta, symbols) => ipcRenderer.send('glyph-cache:write', meta, symbols),
    clear: () => ipcRenderer.invoke('glyph-cache:clear'),
  },

  keymap: {
    lookup: symbol => ipcRenderer.invoke('keymap:lookup', symbol),
  },

  shortcut: {
    set: keys => ipcRenderer.invoke('shortcut:set', keys),
  },

  on(channel, callback) {
    if (!EVENT_CHANNELS.has(channel)) throw new Error(`Unknown event channel: ${channel}`)
    const listener = (_, ...args) => callback(...args)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
}

contextBridge.exposeInMainWorld('emojifinder', api)
