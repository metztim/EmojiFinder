<template>
  <div class="glyph-check-overlay">
    <floating-glyphs class="glyph-check-overlay__glyphs" />
    <div class="glyph-check-overlay__content">
      Checking which emojis your Mac can show …
      <progress-bar :value="progress" />
      <div class="glyph-check-overlay__hint">This runs once per macOS version.</div>
    </div>
  </div>
</template>

<script setup>
import ProgressBar from '@/components/ProgressBar.vue'
import FloatingGlyphs from '@/components/FloatingGlyphs.vue'

defineProps({
  progress: { type: Number, default: 0 },
})
</script>

<style lang="scss" scoped>
.glyph-check-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgb(var(--colorRed));
  color: rgb(var(--colorBlack));
  overflow: hidden;
  border-radius: 6px;

  &__glyphs {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  &__content {
    position: relative;
    z-index: 2;
    width: 240px;
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    line-height: 1.3;
  }

  &__hint {
    font-size: 12px;
    font-weight: 500;
    opacity: 0.7;
  }
}
</style>
