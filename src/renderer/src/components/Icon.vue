<template>
  <span class="icon" v-html="svg" />
</template>

<script setup>
import { computed } from 'vue'

const icons = import.meta.glob('@/assets/icons/*.svg', { query: '?raw', import: 'default', eager: true })

const props = defineProps({
  name: { type: String, required: true },
})

const svg = computed(() => {
  const entry = Object.entries(icons).find(([path]) => path.endsWith(`/${props.name}.svg`))
  if (!entry) console.warn(`Unknown icon "${props.name}"`)
  return entry ? entry[1] : ''
})
</script>

<style lang="scss">
.icon {
  display: inline-flex;
  width: 14px;
  height: 14px;

  > svg {
    width: 100%;
    height: 100%;
    fill: currentColor;

    * {
      fill: inherit;
    }
  }
}
</style>
