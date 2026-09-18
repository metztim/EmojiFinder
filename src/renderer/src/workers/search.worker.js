// Runs off the UI thread: the font-support check over the whole dataset, the search index,
// and result ranking.
//
// Messages in:  { type: 'init', supported?: string[], usage?: [{ symbol, count }] }
//               { type: 'usage', usage: [{ symbol, count }] }
//               { type: 'search', id, query }
// Messages out: { type: 'progress', value }               0..100 while the support check runs
//               { type: 'ready', glyphs, checked }        glyphs the fonts can draw; checked = ran the check
//               { type: 'results', id, symbols }          null symbols = show everything
import { Document, Encoder } from 'flexsearch'
import dataset from '../data/glyphs.json'

const isWord = token => /^[a-z0-9]+(-[a-z0-9]+)*$/i.test(token)
const isEmojiGlyph = glyph => glyph.set === 'Emojis' || /\bemoji\b/.test(glyph.tags)

// Reference "tofu" boxes: unassigned code points render with the fallback glyph of the fallback
// font. A glyph whose pixels match one of them is not drawable on this system.
const UNASSIGNED_CODEPOINTS = ['͸', '΋', '\u{1FFFF}', '\u{2FFFF}']

function createSignatureFn() {
  const canvas = new OffscreenCanvas(30, 10)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.font = '10px Arial'
  ctx.textBaseline = 'alphabetic'

  return glyph => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillText(glyph, 10, 10)
    const pixels = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer)
    // FNV-1a over the pixel buffer; collisions are irrelevant at this scale.
    let hash = 0x811c9dc5
    for (let i = 0; i < pixels.length; i += 1) {
      hash ^= pixels[i]
      hash = Math.imul(hash, 0x01000193)
    }
    return hash >>> 0
  }
}

function findSupportedGlyphs(glyphs) {
  let signatureOf
  try {
    signatureOf = createSignatureFn()
  } catch (error) {
    console.warn('Font support check unavailable, keeping every glyph', error)
    return glyphs
  }

  const tofu = new Set(UNASSIGNED_CODEPOINTS.map(signatureOf))
  if (tofu.has(signatureOf('A'))) {
    console.warn('Font support check cannot tell glyphs apart, keeping every glyph')
    return glyphs
  }

  const supported = []
  let lastProgress = -1

  glyphs.forEach((glyph, index) => {
    if (!tofu.has(signatureOf(glyph.symbol))) supported.push(glyph)

    const progress = Math.floor((100 * (index + 1)) / glyphs.length)
    if (progress !== lastProgress) {
      lastProgress = progress
      postMessage({ type: 'progress', value: progress })
    }
  })

  return supported
}

// Per-glyph data the ranker needs, keyed by symbol.
const meta = new Map()

function buildIndex(glyphs) {
  const index = new Document({
    document: {
      id: 'symbol',
      index: [
        // Symbols, look-alikes such as "->" and single-character tags: matched whole.
        { field: 'signs', tokenize: 'strict', encoder: new Encoder({ normalize: false, dedupe: false, prepare: value => value.toLowerCase(), split: /\s+/ }) },
        // Words: matched by prefix, so "arr" finds "arrow".
        { field: 'words', tokenize: 'forward', encoder: new Encoder({ minlength: 2 }) },
      ],
    },
  })

  meta.clear()

  for (const glyph of glyphs) {
    const tokens = glyph.tags.match(/\S+/g) || []
    const signs = [glyph.symbol]
    const words = []

    for (const token of tokens) {
      if (isWord(token) && token.length > 1) {
        words.push(token)
      } else {
        signs.push(token)
      }
    }

    const name = glyph.name.replace(/-[0-9]/g, '').toLowerCase()
    const category = glyph.category.replace(/-[0-9]/g, '').replace(/-A$/, '').replace(/-B$/, '')

    words.push(glyph.entities, category, name)
    index.add({ symbol: glyph.symbol, signs: signs.join(' '), words: words.join(' ') })

    meta.set(glyph.symbol, {
      name,
      nameWords: name.split(/[\s-]+/).filter(Boolean),
      tags: new Set(tokens.map(token => token.toLowerCase())),
      isEmoji: isEmojiGlyph(glyph),
      // Dashes, fractions, quotes, arrows, currencies: the hand-picked symbols people come for.
      isCurated: Boolean(glyph.set) && glyph.set !== 'Emojis',
      // Skin-tone variants (U+1F3FB to U+1F3FF) rank below their base emoji.
      isSkinToneVariant: /\b1F3F[B-F]\b/.test(glyph.hex),
    })
  }

  return index
}

let index = null
let usageBySymbol = new Map()

function setUsage(usage) {
  usageBySymbol = new Map((usage || []).map(item => [item.symbol, item.count]))
}

// FlexSearch returns candidates in index order. Rank them so that what a person most likely
// means comes first: an exact name, then whole-word matches, with emoji and often-used glyphs
// ahead of obscure look-alikes.
function rank(query, terms, symbols) {
  const scored = symbols.map((symbol, position) => {
    const info = meta.get(symbol)
    let score = 0

    if (symbol === query) score += 200
    if (info) {
      if (info.name === query) score += 40

      for (const term of terms) {
        if (info.nameWords.includes(term)) score += 30
        else if (info.nameWords.some(word => word.startsWith(term))) score += 12

        if (info.tags.has(term)) score += 20
        else {
          for (const tag of info.tags) {
            if (tag.startsWith(term)) {
              score += 6
              break
            }
          }
        }
      }

      if (info.isEmoji) score += 45
      if (info.isCurated) score += 25
      if (info.isSkinToneVariant) score -= 20
      score -= info.name.length * 0.05
    }

    score += Math.min(usageBySymbol.get(symbol) || 0, 50) * 1.5

    return { symbol, score, position }
  })

  scored.sort((a, b) => b.score - a.score || a.position - b.position)
  return scored.map(item => item.symbol)
}

function uniqueSymbols(hits) {
  const seen = new Set()
  const symbols = []
  for (const hit of hits) {
    if (!seen.has(hit.id)) {
      seen.add(hit.id)
      symbols.push(hit.id)
    }
  }
  return symbols
}

function runSearch(query) {
  const terms = query.split(/\s+/).filter(Boolean)
  let symbols = uniqueSymbols(index.search(query, { limit: 100000, merge: true }))

  // Every term had to match. If that leaves nothing for a multi-word query, accept partial matches.
  if (!symbols.length && terms.length > 1) {
    symbols = uniqueSymbols(index.search(query, { limit: 100000, merge: true, suggest: true }))
  }

  return rank(query, terms, symbols)
}

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    let glyphs
    let checked = false

    if (Array.isArray(data.supported)) {
      const supported = new Set(data.supported)
      glyphs = dataset.glyphs.filter(glyph => supported.has(glyph.symbol))
    } else {
      glyphs = findSupportedGlyphs(dataset.glyphs)
      checked = true
    }

    setUsage(data.usage)
    index = buildIndex(glyphs)
    postMessage({ type: 'ready', glyphs, checked, dataVersion: dataset.version })
    return
  }

  if (data.type === 'usage') {
    setUsage(data.usage)
    return
  }

  if (data.type === 'search') {
    const query = (data.query || '').trim().toLowerCase()
    if (!query || !index) {
      postMessage({ type: 'results', id: data.id, symbols: null })
      return
    }
    postMessage({ type: 'results', id: data.id, symbols: runSearch(query) })
  }
}
