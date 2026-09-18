<template>
  <div class="glyph-list" ref="element" @scroll.passive="onScroll">
    <div class="glyph-list__spacer" :style="{ height: `${navigation.totalHeight.value}px` }">
      <glyph-row
        v-for="index in visibleIndexes"
        :key="index"
        class="glyph-list__row"
        :style="{ transform: `translateY(${navigation.offsets.value[index]}px)` }"
        :row="navigation.rows.value[index]"
        :y="index"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import GlyphRow from '@/components/GlyphRow.vue'
import { useNavigation } from '@/composables/useNavigation'

// Only the rows inside the viewport (plus a buffer) exist in the DOM; the list can hold 7,000 rows.
const BUFFER = 200

const navigation = useNavigation()
const element = ref(null)
const scrollTop = ref(0)
const viewportHeight = ref(0)

function firstRowAtOrBelow(offsets, position) {
  let low = 0
  let high = offsets.length - 1
  while (low < high) {
    const mid = (low + high) >> 1
    if (offsets[mid + 1] <= position) low = mid + 1
    else high = mid
  }
  return low
}

const visibleIndexes = computed(() => {
  const offsets = navigation.offsets.value
  if (!offsets.length) return []

  const start = firstRowAtOrBelow(offsets, Math.max(0, scrollTop.value - BUFFER))
  const end = scrollTop.value + viewportHeight.value + BUFFER
  const indexes = []
  for (let index = start; index < offsets.length && offsets[index] < end; index += 1) indexes.push(index)
  return indexes
})

function onScroll() {
  scrollTop.value = element.value.scrollTop
}

let resizeObserver = null

onMounted(() => {
  navigation.scrollElement.value = element.value
  viewportHeight.value = element.value.clientHeight
  resizeObserver = new ResizeObserver(() => {
    viewportHeight.value = element.value.clientHeight
  })
  resizeObserver.observe(element.value)
})

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect()
  navigation.scrollElement.value = null
})
</script>

<style lang="scss" scoped>
.glyph-list {
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  overscroll-behavior: contain;
  margin: -2px;

  &__spacer {
    position: relative;
  }

  &__row {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    will-change: transform;
  }
}
</style>
