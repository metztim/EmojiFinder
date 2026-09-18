<template>
  <div class="entity-list">
    <button
      class="entity-list__item"
      type="button"
      v-for="entity in entities"
      :key="entity"
      :title="`Copy &${entity};`"
      @click.stop="copyText(`&${entity};`)"
    >
      {{ entity }}
    </button>
  </div>
</template>

<script setup>
import { copyText } from '@/services/copy'

defineProps({
  entities: { type: Array, required: true },
})
</script>

<style lang="scss" scoped>
.entity-list {
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
    margin-left: 3px;

    &:first-child {
      margin-left: 0;
    }

    &:hover {
      background-color: rgba(var(--colorWhite), 0.15);
    }
  }
}
</style>
