// Key names as stored in settings and returned by the keymap lookup, rendered the macOS way.
const SYMBOLS = {
  shift: '⇧',
  control: '⌃',
  ctrl: '⌃',
  alt: '⌥',
  option: '⌥',
  super: '⌘',
  command: '⌘',
  cmd: '⌘',
  meta: '⌘',
  enter: '↩',
  return: '↩',
  backspace: '⌫',
  delete: '⌦',
  tab: '⇥',
  space: '␣',
  escape: '⎋',
  esc: '⎋',
  capslock: '⇪',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

// Characters whose upper-case form would change their meaning on a keycap.
const KEEP_CASE = new Set(['ß'])

export function keyLabel(name) {
  if (!name) return ''
  const symbol = SYMBOLS[String(name).toLowerCase()]
  if (symbol) return symbol
  return KEEP_CASE.has(name) ? name : String(name).toUpperCase()
}
