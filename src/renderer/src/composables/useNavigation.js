import { ref, computed, watch, provide, inject, onMounted, onBeforeUnmount } from 'vue'
import { api } from '@/services/api'
import { useSettings } from '@/composables/useSettings'
import { copyGlyph } from '@/services/copy'

const NAVIGATION = Symbol('navigation')

export const ITEMS_PER_ROW = 5
export const ROW_HEIGHT = 62
export const ROW_WITH_TITLE_HEIGHT = 92
export const CARD_HEIGHT_COLLAPSED = 54
export const CARD_HEIGHT_EXPANDED = 101
const FREQUENTLY_USED_LIMIT = 25
const DEFAULT_SET = 'Other Characters'
const SET_ORDER = ['Dashes', 'Fractions', 'Quotes', 'Keys', 'Spaces', 'Currencies', 'Arrows', 'Emojis', DEFAULT_SET]

function chunk(items, size) {
  const rows = []
  for (let i = 0; i < items.length; i += size) rows.push({ glyphs: items.slice(i, i + size) })
  return rows
}

// Turns the current glyph list into rows, tracks the keyboard selection and scrolls it into view.
// `glyphs` is the search result; `isFiltered` says whether a query is active (then no grouping);
// `disabled` pauses keyboard handling while an overlay owns the keyboard.
export function createNavigation({ glyphs, isFiltered, disabled = ref(false) }) {
  const { settings, setSetting } = useSettings()

  const selection = ref({ x: 0, y: 0 })
  const isExpanded = ref(Boolean(settings.expanded))
  const scrollElement = ref(null)
  // Usage only refreshes when the window hides, so the list does not jump around mid-session.
  const usage = ref(settings.usage || [])

  const glyphMap = computed(() => new Map(glyphs.value.map(glyph => [glyph.symbol, glyph])))

  const frequentlyUsedGlyphs = computed(() => {
    if (isFiltered.value) return []
    return [...usage.value]
      .sort((a, b) => b.count - a.count)
      .map(item => glyphMap.value.get(item.symbol))
      .filter(Boolean)
      .slice(0, FREQUENTLY_USED_LIMIT)
      .map(glyph => ({ ...glyph, id: `frequently_used_${glyph.symbol}` }))
  })

  const frequentlyUsedRows = computed(() => chunk(frequentlyUsedGlyphs.value, ITEMS_PER_ROW)
    .map((row, index) => (index === 0
      ? { ...row, title: 'Frequently used', height: ROW_WITH_TITLE_HEIGHT }
      : { ...row, height: ROW_HEIGHT })))

  const glyphRows = computed(() => {
    const items = glyphs.value.map(glyph => ({ ...glyph, id: glyph.symbol }))

    if (isFiltered.value) {
      return chunk(items, ITEMS_PER_ROW).map(row => ({ ...row, height: ROW_HEIGHT }))
    }

    const groups = new Map()
    for (const glyph of items) {
      const set = glyph.set || DEFAULT_SET
      if (!groups.has(set)) groups.set(set, [])
      groups.get(set).push(glyph)
    }

    const rank = set => {
      const index = SET_ORDER.indexOf(set)
      return index >= 0 ? index : SET_ORDER.length
    }

    return [...groups.entries()]
      .sort(([a], [b]) => rank(a) - rank(b))
      .flatMap(([set, groupGlyphs]) => chunk(groupGlyphs, ITEMS_PER_ROW)
        .map((row, index) => (index === 0
          ? { ...row, title: set, height: ROW_WITH_TITLE_HEIGHT }
          : { ...row, height: ROW_HEIGHT })))
  })

  const rows = computed(() => {
    const all = [...frequentlyUsedRows.value, ...glyphRows.value]
    if (!all.length) return all
    // Extra room under the last row so the glyph card never covers it.
    const last = all[all.length - 1]
    all[all.length - 1] = { ...last, height: last.height + CARD_HEIGHT_EXPANDED + 20 }
    return all
  })

  const offsets = computed(() => {
    let offset = 0
    return rows.value.map(row => {
      const current = offset
      offset += row.height
      return current
    })
  })

  const totalHeight = computed(() => offsets.value.length
    ? offsets.value[offsets.value.length - 1] + rows.value[rows.value.length - 1].height
    : 0)

  const selectedGlyph = computed(() => {
    const row = rows.value[selection.value.y]
    return row ? row.glyphs[selection.value.x] || null : null
  })

  function setSelection(x, y) {
    selection.value = { x, y }
  }

  function scrollSelectionIntoView() {
    const element = scrollElement.value
    const { y } = selection.value
    const row = rows.value[y]
    if (!element || !row) return

    const top = offsets.value[y]
    const bottom = top + (row.title ? ROW_WITH_TITLE_HEIGHT : ROW_HEIGHT)
    const cardHeight = (isExpanded.value ? CARD_HEIGHT_EXPANDED : CARD_HEIGHT_COLLAPSED) + 16
    const viewTop = element.scrollTop
    const viewBottom = viewTop + element.clientHeight - cardHeight

    if (top < viewTop) {
      element.scrollTop = top
    } else if (bottom > viewBottom) {
      element.scrollTop = bottom - (element.clientHeight - cardHeight)
    }
  }

  function moveSelection(direction) {
    const { x, y } = selection.value
    const row = rows.value[y]
    if (!row) return

    if (direction === 'right') {
      if (row.glyphs[x + 1]) setSelection(x + 1, y)
      else if (rows.value[y + 1]) setSelection(0, y + 1)
    } else if (direction === 'left') {
      if (row.glyphs[x - 1]) setSelection(x - 1, y)
      else if (rows.value[y - 1]) setSelection(rows.value[y - 1].glyphs.length - 1, y - 1)
    } else if (direction === 'down' || direction === 'up') {
      const next = rows.value[direction === 'down' ? y + 1 : y - 1]
      if (next) setSelection(Math.min(x, next.glyphs.length - 1), direction === 'down' ? y + 1 : y - 1)
    }

    scrollSelectionIntoView()
  }

  function toggleExpand() {
    isExpanded.value = !isExpanded.value
    setSetting('expanded', isExpanded.value)
  }

  function resetView() {
    setSelection(0, 0)
    if (scrollElement.value) scrollElement.value.scrollTop = 0
  }

  function copySelected() {
    if (selectedGlyph.value) copyGlyph(selectedGlyph.value)
  }

  function handleKeyDown(event) {
    const { key, ctrlKey, metaKey } = event

    // Let overlays (preferences, license) own the keyboard while they are open.
    if (disabled.value || event.defaultPrevented) return

    if (key.startsWith('Arrow')) event.preventDefault()

    if (key === 'ArrowDown' || (ctrlKey && key === 'n')) moveSelection('down')
    else if (key === 'ArrowUp' || (ctrlKey && key === 'p')) moveSelection('up')
    else if (key === 'ArrowRight' || (ctrlKey && key === 'f')) moveSelection('right')
    else if (key === 'ArrowLeft' || (ctrlKey && key === 'b')) moveSelection('left')
    else if (key === 'Enter' || (metaKey && key === 'c' && !window.getSelection().toString())) {
      event.preventDefault()
      copySelected()
    }
  }

  function handleWindowHidden() {
    usage.value = settings.usage || []
    if (settings.clearSearchOnHide) resetView()
  }

  watch(glyphs, () => resetView())

  let offHidden = () => {}

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
    offHidden = api.on('window:hidden', handleWindowHidden)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeyDown)
    offHidden()
  })

  const navigation = {
    rows,
    offsets,
    totalHeight,
    selection,
    selectedGlyph,
    isExpanded,
    scrollElement,
    setSelection,
    toggleExpand,
    copySelected,
  }

  provide(NAVIGATION, navigation)
  return navigation
}

export function useNavigation() {
  return inject(NAVIGATION)
}
