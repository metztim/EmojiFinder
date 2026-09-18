import Store from 'electron-store'

// Settings live in ~/Library/Application Support/EmojiFinder/config.json.
export const defaults = {
  shortcut: ['control', 'super', 'g'],
  showMenubar: true,
  autoStart: true,
  hideAfterCopy: true,
  clearSearchOnHide: true,
  expanded: false,
  usage: [],
  darkMode: 'system',
}

export const store = new Store({ defaults })

export function settingsSnapshot() {
  return { ...store.store }
}
