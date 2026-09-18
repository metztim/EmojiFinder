<template>
  <div class="progress-bar">
    <div class="progress-bar__bar" :style="{ width: `${percentage}%` }" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
})

const percentage = computed(() => (props.max ? Math.min(100, (100 / props.max) * props.value) : 0))
</script>

<style lang="scss" scoped>
.progress-bar {
  position: relative;
  width: 100%;
  height: 4px;
  background-color: rgba(var(--colorBlack), 0.1);
  border-radius: 4px;
  margin: 8px 0;
  overflow: hidden;

  &__bar {
    height: 100%;
    background-color: rgb(var(--colorBlack));
    border-radius: inherit;
    transition: width 0.3s $ease;
  }
}
</style>
