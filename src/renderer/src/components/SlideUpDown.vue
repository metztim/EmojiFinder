<template>
  <div class="slide-up-down" :class="{ 'is-active': active }">
    <div class="slide-up-down__inner">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false },
})
</script>

<style lang="scss" scoped>
// Animating grid rows from 0fr to 1fr collapses and expands without knowing the content height.
.slide-up-down {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 0.2s $ease, opacity 0.2s $ease;

  &.is-active {
    grid-template-rows: 1fr;
    opacity: 1;
  }

  &__inner {
    min-height: 0;
    overflow: hidden;
  }
}
</style>
