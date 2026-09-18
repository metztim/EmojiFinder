import { shallowRef, watch } from 'vue'
import SearchWorker from '@/workers/search.worker.js?worker'
import { api, info } from '@/services/api'
import { useSettings } from '@/composables/useSettings'
import { version as dataVersion } from '@/data/data-version.json'

// Owns the worker that holds the dataset and the search index. The renderer only ever keeps the
// list of drawable glyphs (for rendering) and asks the worker for ordered symbol lists.
const worker = new SearchWorker()
const { settings } = useSettings()

// Plain objects only: postMessage cannot clone Vue's reactive proxies.
const plainUsage = () => (settings.usage || []).map(item => ({ symbol: item.symbol, count: item.count }))

// The ranker favours glyphs this person copies often.
watch(() => settings.usage, () => worker.postMessage({ type: 'usage', usage: plainUsage() }))

export const glyphs = shallowRef([])
export const glyphsBySymbol = new Map()

const cacheMeta = { dataVersion, appVersion: info.version, osVersion: info.osVersion }

let searchId = 0
const pendingSearches = new Map()
let resolveReady = null
let progressCallback = () => {}

worker.onmessage = ({ data }) => {
  if (data.type === 'progress') {
    progressCallback(data.value)
  } else if (data.type === 'ready') {
    glyphsBySymbol.clear()
    for (const glyph of data.glyphs) glyphsBySymbol.set(glyph.symbol, glyph)
    glyphs.value = data.glyphs

    if (data.checked) {
      api.glyphCache.write(cacheMeta, data.glyphs.map(glyph => glyph.symbol))
    }
    if (resolveReady) resolveReady(data)
  } else if (data.type === 'results') {
    const resolve = pendingSearches.get(data.id)
    if (resolve) {
      pendingSearches.delete(data.id)
      resolve(data.symbols)
    }
  }
}

// Resolves once the glyph list and the search index are ready. Runs the font-support check
// unless a cache for this dataset, app, and macOS version exists; onCheckStart fires when it runs.
export async function loadGlyphs({ onCheckStart = () => {}, onProgress = () => {} } = {}) {
  progressCallback = onProgress

  const supported = await api.glyphCache.read(cacheMeta)
  if (!Array.isArray(supported)) onCheckStart()

  return new Promise(resolve => {
    resolveReady = resolve
    worker.postMessage({ type: 'init', supported, usage: plainUsage() })
  })
}

// Returns ordered symbols, null for "no filter" when the query is empty, or undefined when a
// newer query superseded this one.
export function search(query) {
  searchId += 1
  const id = searchId

  return new Promise(resolve => {
    for (const [pendingId, pendingResolve] of pendingSearches) {
      if (pendingId < id) {
        pendingSearches.delete(pendingId)
        pendingResolve(undefined)
      }
    }
    pendingSearches.set(id, resolve)
    worker.postMessage({ type: 'search', id, query })
  })
}
