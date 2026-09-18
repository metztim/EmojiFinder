<template>
  <div class="key-list">
    <span class="key-list__item" v-for="(key, index) in keys" :key="index">{{ keyLabel(key) }}</span>
  </div>
</template>

<script setup>
import { keyLabel } from '@/services/keySymbol'

defineProps({
  keys: { type: Array, required: true },
})
</script>

<style lang="scss" scoped>
.key-list {
  display: inline-flex;

  &__item {
    display: inline-flex;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    min-width: 20px;
    background-color: rgba(var(--colorWhite), 0.1);
    padding: 2px 5px;
    border-radius: 3px;
    letter-spacing: 0.05em;
    margin-left: 3px;

    &:first-child {
      margin-left: 0;
    }
  }
}
</style>
