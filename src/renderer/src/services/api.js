// The preload bridge. Exposed by src/preload/index.js as window.emojifinder.
export const api = window.emojifinder

export const { info } = api

export const isMac = info.platform === 'darwin'
