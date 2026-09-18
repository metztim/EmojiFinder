import fs from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

const userData = () => app.getPath('userData')
const cachePath = () => join(userData(), 'supported-glyphs.json')

// The renderer checks which glyphs the installed fonts can draw. That check takes a few seconds
// for 35k glyphs, so the resulting symbol list is cached together with the inputs that can change
// the outcome: the dataset version, the app version, and the macOS version (new emoji fonts).
export function readSupportedGlyphs(meta) {
  try {
    if (!fs.existsSync(cachePath())) return null
    const cache = JSON.parse(fs.readFileSync(cachePath(), 'utf8'))
    const matches = ['dataVersion', 'appVersion', 'osVersion'].every(key => cache[key] === meta[key])
    return matches && Array.isArray(cache.symbols) ? cache.symbols : null
  } catch (error) {
    console.error('Could not read the glyph cache', error)
    return null
  }
}

export function writeSupportedGlyphs(meta, symbols) {
  fs.writeFileSync(cachePath(), JSON.stringify({ ...meta, symbols }))
}

export function clearSupportedGlyphs() {
  if (fs.existsSync(cachePath())) fs.unlinkSync(cachePath())
}
