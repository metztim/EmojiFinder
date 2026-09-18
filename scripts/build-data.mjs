// Builds src/renderer/src/data/glyphs.json.
//
// Sources:
//   data/upstream-glyphs.json   the curated Glyphfinder 1.4.1 dataset (34,306 glyphs; tags,
//                               sets, and look-alikes maintained in the überdosis spreadsheet)
//   emojibase-data              the current Unicode emoji list, used to add emoji released
//                               after the upstream dataset froze and to widen emoji tags
//
// Output shape: { version, glyphs: [{ symbol, hex, code, name, category, entities, set, tags }] }
// `version` is a content hash; the app uses it to invalidate its font-support cache.

import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import emojis from 'emojibase-data/en/data.json' with { type: 'json' }
import groups from 'emojibase-data/meta/groups.json' with { type: 'json' }
import shortcodes from 'emojibase-data/en/shortcodes/emojibase.json' with { type: 'json' }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const upstreamPath = path.join(root, 'data', 'upstream-glyphs.json')
const outputPath = path.join(root, 'src', 'renderer', 'src', 'data', 'glyphs.json')

const upstream = JSON.parse(fs.readFileSync(upstreamPath, 'utf8'))

const stripVariationSelectors = value => value.replace(/️/g, '')
const hexFromCode = hexcode => hexcode.split('-').join(' ')
const uniqueWords = words => [...new Set(words.filter(Boolean))]

const shortcodeWords = hexcode => {
  const codes = shortcodes[hexcode]
  if (!codes) return []
  return (Array.isArray(codes) ? codes : [codes]).flatMap(code => code.split('_'))
}

const emojiTags = (entry, groupIndex, subgroupIndex) => uniqueWords([
  'emoji',
  groups.subgroups[subgroupIndex],
  ...(entry.tags || []),
  ...shortcodeWords(entry.hexcode),
])

// Flatten emojibase entries so skin-tone variants sit right after their base emoji.
const flatEmojis = []
for (const entry of emojis) {
  flatEmojis.push({ entry, group: entry.group, subgroup: entry.subgroup })
  for (const skin of entry.skins || []) {
    flatEmojis.push({ entry: skin, group: entry.group, subgroup: entry.subgroup, tags: entry.tags })
  }
}

const bySymbol = new Map()
for (const glyph of upstream) {
  bySymbol.set(glyph.symbol, glyph)
  bySymbol.set(stripVariationSelectors(glyph.symbol), glyph)
}

let added = 0
let widened = 0
const addedVersions = new Map()
const newEmoji = []

for (const { entry, group, subgroup, tags } of flatEmojis) {
  const existing = bySymbol.get(entry.emoji) || bySymbol.get(stripVariationSelectors(entry.emoji))
  const freshTags = emojiTags({ ...entry, tags: entry.tags || tags }, group, subgroup)

  if (existing) {
    const merged = uniqueWords([...(existing.tags.match(/\S+/g) || []), ...freshTags])
    if (merged.length > (existing.tags.match(/\S+/g) || []).length) widened += 1
    existing.tags = merged.join(' ')
    continue
  }

  newEmoji.push({
    symbol: entry.emoji,
    hex: hexFromCode(entry.hexcode),
    code: '',
    name: entry.label,
    category: groups.groups[group],
    entities: '',
    set: 'Emojis',
    tags: freshTags.join(' '),
  })
  added += 1
  addedVersions.set(entry.version, (addedVersions.get(entry.version) || 0) + 1)
}

// Keep upstream order for everything, append the new emoji after the last upstream emoji so
// they land inside the "Emojis" group rather than after "Other Glyphs".
const lastEmojiIndex = upstream.map(glyph => glyph.set).lastIndexOf('Emojis')
const glyphs = [
  ...upstream.slice(0, lastEmojiIndex + 1),
  ...newEmoji,
  ...upstream.slice(lastEmojiIndex + 1),
]

const duplicates = glyphs.filter((glyph, index) => glyphs.findIndex(other => other.symbol === glyph.symbol) !== index)
if (duplicates.length) {
  throw new Error(`Duplicate symbols in dataset: ${duplicates.map(glyph => glyph.symbol).join(' ')}`)
}

const json = JSON.stringify(glyphs)
const version = createHash('sha1').update(json).digest('hex').slice(0, 12)

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify({ version, glyphs: JSON.parse(json) }))
// The renderer needs the version without loading the dataset (only the worker does that).
fs.writeFileSync(path.join(path.dirname(outputPath), 'data-version.json'), JSON.stringify({ version }))

console.log(`upstream glyphs: ${upstream.length}`)
console.log(`emoji added:     ${added} (${[...addedVersions.entries()].sort((a, b) => a[0] - b[0]).map(([v, n]) => `Emoji ${v}: ${n}`).join(', ')})`)
console.log(`emoji tags widened: ${widened}`)
console.log(`total glyphs:    ${glyphs.length}`)
console.log(`dataset version: ${version}`)
console.log(`written:         ${path.relative(root, outputPath)} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)} MB)`)
