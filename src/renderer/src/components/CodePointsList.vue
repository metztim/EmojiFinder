<template>
  <div class="code-points-list">
    <button
      class="code-points-list__item"
      type="button"
      :title="`Copy ${formatted}`"
      @click.stop="copyText(formatted)"
    >
      {{ formatted }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { copyText } from '@/services/copy'

const props = defineProps({
  codePoints: { type: String, required: true },
})

const formatted = computed(() => props.codePoints.split(' ').map(hex => `U+${hex}`).join(' '))
</script>

<style lang="scss" scoped>
.code-points-list {
  display: inline-flex;

  &__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    min-width: 20px;
    background-color: rgba(var(--colorWhite), 0.1);
    padding: 2px 5px;
    border-radius: 3px;
    letter-spacing: 0.05em;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      background-color: rgba(var(--colorWhite), 0.15);
    }
  }
}
</style>
