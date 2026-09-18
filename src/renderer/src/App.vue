<template>
  <div class="wrapper" :class="{ 'is-loaded': isLoaded }">
    <div class="wrapper__content" :class="{ 'is-hidden': showPreferences }">
      <glyph-wrapper v-if="isReady" :show-preferences="showPreferences" />
      <div class="wrapper__content-overlay" />
    </div>

    <transition name="options">
      <preferences-overlay class="wrapper__overlay" v-if="showPreferences" @close="showPreferences = false" />
    </transition>

    <transition name="options">
      <glyph-check-overlay class="wrapper__overlay" v-if="showGlyphCheck" :progress="progress" />
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import GlyphWrapper from '@/components/GlyphWrapper.vue'
import PreferencesOverlay from '@/components/PreferencesOverlay.vue'
import GlyphCheckOverlay from '@/components/GlyphCheckOverlay.vue'
import { api } from '@/services/api'
import { loadGlyphs } from '@/services/glyphs'

const isLoaded = ref(false)
const isReady = ref(false)
const showPreferences = ref(false)
const showGlyphCheck = ref(false)
const progress = ref(0)

function onShowPreferences() {
  if (showGlyphCheck.value) return
  showPreferences.value = true
}

let offPreferences = () => {}

onMounted(async () => {
  requestAnimationFrame(() => {
    isLoaded.value = true
  })

  offPreferences = api.on('preferences:show', onShowPreferences)

  await loadGlyphs({
    onCheckStart: () => {
      showGlyphCheck.value = true
    },
    onProgress: value => {
      progress.value = value
    },
  })

  isReady.value = true
  showGlyphCheck.value = false
})

onBeforeUnmount(() => offPreferences())
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100vh;
  padding-top: var(--menuBarSize);
  overflow: hidden;
  background-color: var(--colorBackground);
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.6s $easeInOut, background-color 0.3s $ease;

  &.is-loaded {
    opacity: 1;
  }

  // The strip above the content doubles as the window drag handle.
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: var(--menuBarSize);
    pointer-events: none;
    -webkit-app-region: drag;
  }

  &__content {
    flex: 1 1 auto;
    overflow: hidden;
    transition: transform 0.6s $easeInOutQuint, border-radius 0.6s $easeInOutQuint;
    transform-origin: center 100%;

    &.is-hidden {
      transform: scale(0.9) translateY(-8px);
      border-radius: 12px;
      pointer-events: none;
    }
  }

  &__content-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgb(var(--colorBlack));
    visibility: hidden;
    opacity: 0;
    z-index: 1;
    transition: visibility 0.6s $easeInOutQuint, opacity 0.6s $easeInOutQuint;
  }

  &__content.is-hidden &__content-overlay {
    visibility: visible;
    opacity: 1;
  }

  // Each overlay is its own stacking context, so positioned children stay inside it.
  &__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    isolation: isolate;
  }
}
</style>
