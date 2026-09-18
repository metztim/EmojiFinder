<template>
  <button class="button" :class="{ 'is-red': isRed }" type="button">
    <icon class="button__icon" :name="icon" v-if="icon" />
    <span class="button__content" v-if="$slots.default">
      <slot />
    </span>
  </button>
</template>

<script setup>
import Icon from '@/components/Icon.vue'

defineProps({
  icon: { type: String, default: null },
  isRed: { type: Boolean, default: false },
})
</script>

<style lang="scss" scoped>
.button {
  display: inline-flex;
  align-items: center;
  padding: 6px;
  margin-left: 8px;
  color: rgba(var(--colorWhite), 0.5);
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  border-radius: 6px;
  cursor: pointer;
  background-color: rgba(var(--colorWhite), 0.09);
  transition: color 0.2s $ease, background-color 0.2s $ease;
  -webkit-app-region: no-drag;

  &:first-child {
    margin-left: 0;
  }

  &:hover {
    color: rgba(var(--colorWhite), 1);
    background-color: rgba(var(--colorWhite), 0.12);
  }

  &.is-red {
    background-color: rgb(var(--colorRed));
    color: rgb(var(--colorBlack));

    &:hover {
      background-color: rgba(var(--colorRed), 0.9);
    }
  }

  &__icon + &__content {
    margin-left: 2px;
  }

  & + & {
    margin-left: 6px;
  }
}
</style>
