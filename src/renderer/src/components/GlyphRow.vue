<template>
  <div class="glyph-row" :style="{ height: `${row.height}px` }">
    <div class="glyph-row__title" :style="{ height: `${titleHeight}px` }" v-if="row.title">
      {{ row.title }}
    </div>
    <glyph-item
      v-for="(glyph, index) in row.glyphs"
      :key="glyph.id"
      :glyph="glyph"
      :x="index"
      :y="y"
    />
  </div>
</template>

<script setup>
import GlyphItem from '@/components/GlyphItem.vue'
import { ROW_HEIGHT, ROW_WITH_TITLE_HEIGHT } from '@/composables/useNavigation'

defineProps({
  row: { type: Object, required: true },
  y: { type: Number, required: true },
})

const titleHeight = ROW_WITH_TITLE_HEIGHT - ROW_HEIGHT
</script>

<style lang="scss" scoped>
.glyph-row {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;

  &__title {
    display: inline-flex;
    align-items: center;
    width: 100%;
    font-size: 12px;
    font-weight: 500;
    color: rgba(var(--colorWhite), 0.4);
    padding-left: 2px;
  }
}
</style>
