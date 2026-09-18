<template>
  <button
    class="glyph-item"
    :class="{ 'is-active': isSelected, 'is-emoji': isEmoji, 'is-space': isSpace }"
    type="button"
    :title="glyph.name"
    @click="navigation.setSelection(x, y)"
    @dblclick="copyGlyph(glyph)"
  >
    <span class="glyph-item__symbol">{{ glyph.symbol }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useNavigation } from '@/composables/useNavigation'
import { copyGlyph } from '@/services/copy'

const props = defineProps({
  glyph: { type: Object, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
})

const navigation = useNavigation()

const isSelected = computed(() => navigation.selectedGlyph.value?.id === props.glyph.id)
const isEmoji = computed(() => props.glyph.set === 'Emojis' || /\bemoji\b/.test(props.glyph.tags))
// Whitespace glyphs get a hatched fill so they are visible. U+1680 (Ogham space) draws its own mark.
const isSpace = computed(() => !/[^\s]/.test(props.glyph.symbol) && String(props.glyph.code) !== '5760')
</script>

<style lang="scss" scoped>
.glyph-item {
  display: inline-flex;
  width: 58px;
  height: 58px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 20px;
  font-weight: 600;
  background-color: var(--colorGlyphBackground);
  overflow: hidden;
  margin: 2px;
  white-space: pre;
  cursor: pointer;

  &.is-emoji {
    font-family: 'Apple Color Emoji', sans-serif;
    font-size: 26px;
  }

  &.is-space &__symbol {
    border-radius: 2px;
    background-size: 5px 5px;
    background-image: linear-gradient(
      135deg,
      rgba(var(--colorRed), 0.6) 16.67%,
      rgba(var(--colorBlack), 0.6) 16.67%,
      rgba(var(--colorBlack), 0.6) 50%,
      rgba(var(--colorRed), 0.6) 50%,
      rgba(var(--colorRed), 0.6) 66.67%,
      rgba(var(--colorBlack), 0.6) 66.67%,
      rgba(var(--colorBlack), 0.6) 100%
    );
  }

  &:not(.is-active):hover {
    background-color: rgba(var(--colorWhite), 0.08);
  }

  .is-dark-mode &:not(.is-active):hover {
    background-color: rgba(var(--colorWhite), 0.14);
  }

  &.is-active {
    background-color: rgb(var(--colorRed));
    color: rgb(var(--colorBlack));
  }
}
</style>
