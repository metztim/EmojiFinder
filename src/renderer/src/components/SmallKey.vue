<template>
  <span class="small-key" :title="name">{{ keyLabel(name) }}</span>
</template>

<script setup>
import { keyLabel } from '@/services/keySymbol'

defineProps({
  name: { type: String, required: true },
})
</script>

<style lang="scss" scoped>
.small-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  padding: 0 3px;
  height: 26px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(var(--colorWhite), 0.7);
  line-height: 1;
  border-radius: 6px;
  background-color: rgba(var(--colorWhite), 0.1);
  margin-left: 3px;

  &:first-child {
    margin-left: 0;
  }
}
</style>
