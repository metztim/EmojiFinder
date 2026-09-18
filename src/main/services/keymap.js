import nativeKeymap from 'native-keymap'

// Answers "which keys type this character on the current keyboard layout", for the
// Shortcut row of the glyph card. Refreshed whenever macOS reports a layout change.
let entries = []

function loadKeymap() {
  const keymap = nativeKeymap.getKeyMap()

  // Swap Backquote and IntlBackslash on ISO keyboards, see microsoft/vscode#24153.
  if (nativeKeymap.isISOKeyboard && nativeKeymap.isISOKeyboard()) {
    const { Backquote, IntlBackslash } = keymap
    keymap.IntlBackslash = Backquote
    keymap.Backquote = IntlBackslash
  }

  entries = Object.entries(keymap).map(([code, data]) => ({ code, ...data }))
}

export function watchKeymap() {
  loadKeymap()
  if (typeof nativeKeymap.onDidChangeKeyboardLayout === 'function') {
    nativeKeymap.onDidChangeKeyboardLayout(loadKeymap)
  }
}

export function lookupShortcut(symbol) {
  for (const key of entries) {
    const value = key.value === ' ' ? 'space' : key.value

    if (key.value === symbol) return [value]
    if (key.withAltGr === symbol) return ['alt', value]
    if (key.withShift === symbol) return ['shift', value]
    if (key.withShiftAltGr === symbol) return ['shift', 'alt', value]
  }

  return null
}
