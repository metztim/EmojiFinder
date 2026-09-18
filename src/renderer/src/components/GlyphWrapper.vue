<template>
  <div class="glyph-wrapper">
    <div class="glyph-wrapper__header">
      <div class="glyph-wrapper__search-wrapper">
        <input
          class="glyph-wrapper__search"
          ref="searchInput"
          type="text"
          placeholder="Search …"
          autofocus
          spellcheck="false"
          v-model="query"
          @keydown.esc="onEscape"
          @blur="refocus"
        >
        <button class="glyph-wrapper__reset" type="button" title="Clear search" @click="reset" v-if="trimmedQuery">
          <icon name="close" />
        </button>
      </div>
    </div>

    <div class="glyph-wrapper__content">
      <glyph-list />
      <div class="glyph-wrapper__empty" v-if="isFiltered && !results.length && !isSearching">
        No emojis or characters match “{{ trimmedQuery }}”
      </div>
    </div>

    <glyph-data class="glyph-wrapper__overlay" :glyph="navigation.selectedGlyph.value" v-if="navigation.selectedGlyph.value" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Icon from '@/components/Icon.vue'
import GlyphList from '@/components/GlyphList.vue'
import GlyphData from '@/components/GlyphData.vue'
import { createNavigation } from '@/composables/useNavigation'
import { useSettings } from '@/composables/useSettings'
import { glyphs, glyphsBySymbol, search } from '@/services/glyphs'
import { api } from '@/services/api'

const props = defineProps({
  showPreferences: { type: Boolean, default: false },
})

const { settings } = useSettings()

const searchInput = ref(null)
const query = ref('')
const isSearching = ref(false)
const resultSymbols = ref(null)

const trimmedQuery = computed(() => query.value.trim())
const isFiltered = computed(() => trimmedQuery.value.length > 0)

const results = computed(() => {
  if (!isFiltered.value || resultSymbols.value === null) return glyphs.value
  return resultSymbols.value.map(symbol => glyphsBySymbol.get(symbol)).filter(Boolean)
})

const navigation = createNavigation({
  glyphs: results,
  isFiltered,
  disabled: computed(() => props.showPreferences),
})

let debounce = null
watch(trimmedQuery, value => {
  clearTimeout(debounce)
  if (!value) {
    resultSymbols.value = null
    isSearching.value = false
    return
  }

  isSearching.value = true
  debounce = setTimeout(async () => {
    const symbols = await search(value)
    if (symbols === undefined) return // superseded by a newer query
    resultSymbols.value = symbols
    isSearching.value = false
  }, 40)
})

function reset() {
  query.value = ''
}

// Escape clears the search first; a second press hides the window.
function onEscape() {
  if (props.showPreferences) return
  if (trimmedQuery.value) {
    reset()
  } else {
    api.hide()
  }
}

function refocus() {
  nextTick(() => {
    if (searchInput.value && !props.showPreferences) searchInput.value.focus()
  })
}

function onWindowHidden() {
  if (settings.clearSearchOnHide) reset()
}

let offHidden = () => {}

onMounted(() => {
  refocus()
  offHidden = api.on('window:hidden', onWindowHidden)
})

watch(() => props.showPreferences, open => {
  if (!open) refocus()
})

onBeforeUnmount(() => offHidden())
</script>

<style lang="scss" scoped>
.glyph-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 16px;

  &__header {
    flex: 0 0 auto;
  }

  &__content {
    position: relative;
    flex: 1 1 auto;
    overflow: hidden;
    margin-right: -14px;
  }

  &__search-wrapper {
    position: relative;
    margin-bottom: 12px;
  }

  &__search {
    width: 100%;
    padding: 8px;
    font-size: 12px;
    background-color: var(--colorSearchBackground);
    border-radius: 4px;
    font-weight: 500;
    font-variant-ligatures: none;
    user-select: text;

    &::placeholder {
      color: rgba(var(--colorWhite), 0.2);
    }
  }

  &__reset {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    color: rgba(var(--colorWhite), 0.4);
    transition: color 0.2s $ease;
    cursor: pointer;

    &:hover {
      color: rgba(var(--colorWhite), 0.6);
    }
  }

  &__empty {
    position: absolute;
    top: 24px;
    left: 0;
    right: 14px;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: rgba(var(--colorWhite), 0.4);
  }

  &__overlay {
    position: absolute;
    bottom: 8px;
    left: 8px;
    width: calc(100% - 16px);
  }
}
</style>
