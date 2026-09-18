import fs from 'node:fs'
import { join } from 'node:path'

// Glyphfinder 1.x kept its settings in ~/Library/Application Support/Glyphfinder/config.json.
// On EmojiFinder's first launch that file seeds the new settings, so preferences, the shortcut,
// and the "Frequently used" history carry over. The old directory is left as it is.
export function importLegacySettings(userDataPath, appDataPath) {
  const target = join(userDataPath, 'config.json')
  if (fs.existsSync(target)) return false

  const legacyPath = join(appDataPath, 'Glyphfinder', 'config.json')
  if (!fs.existsSync(legacyPath)) return false

  try {
    // Licensing and migration bookkeeping belong to the old app and are not carried over.
    const { verification, __internal__, ...settings } = JSON.parse(fs.readFileSync(legacyPath, 'utf8'))

    if (settings.darkMode === 'true') settings.darkMode = 'dark'
    if (settings.darkMode === 'false') settings.darkMode = 'light'

    fs.mkdirSync(userDataPath, { recursive: true })
    fs.writeFileSync(target, JSON.stringify(settings, null, '\t'))
    console.log(`Imported Glyphfinder settings from ${legacyPath}`)
    return true
  } catch (error) {
    console.error('Could not import Glyphfinder settings', error)
    return false
  }
}
