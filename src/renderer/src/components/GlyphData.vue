<template>
  <div class="glyph-data" @click="navigation.toggleExpand">
    <transition name="clipboard">
      <clipboard-badge class="glyph-data__clipboard" v-if="showCopied" />
    </transition>

    <div class="glyph-data__card">
      <div class="glyph-data__header">
        <div class="glyph-data__name" :title="glyph.name">
          {{ glyph.name }}
        </div>
        <icon class="glyph-data__icon" :class="{ 'is-active': navigation.isExpanded.value }" name="arrow-down" />
      </div>

      <slide-up-down :active="navigation.isExpanded.value">
        <div class="glyph-data__content">
          <div class="glyph-data__item">
            <div class="glyph-data__label">Shortcut</div>
            <key-list :keys="shortcut" v-if="shortcut && shortcut.length > 1" />
            <div class="glyph-data__empty" v-else>–</div>
          </div>

          <div class="glyph-data__item">
            <div class="glyph-data__label">Entities</div>
            <entity-list :entities="entities" v-if="entities.length" />
            <div class="glyph-data__empty" v-else>–</div>
          </div>

          <div class="glyph-data__item">
            <div class="glyph-data__label">{{ glyph.hex.includes(' ') ? 'Code Points' : 'Code Point' }}</div>
            <code-points-list :code-points="glyph.hex" />
          </div>
        </div>
      </slide-up-down>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Icon from '@/components/Icon.vue'
import SlideUpDown from '@/components/SlideUpDown.vue'
import EntityList from '@/components/EntityList.vue'
import CodePointsList from '@/components/CodePointsList.vue'
import KeyList from '@/components/KeyList.vue'
import ClipboardBadge from '@/components/ClipboardBadge.vue'
import { useNavigation } from '@/composables/useNavigation'
import { copiedAt } from '@/services/copy'
import { api } from '@/services/api'

const props = defineProps({
  glyph: { type: Object, required: true },
})

const navigation = useNavigation()

const shortcut = ref(null)
const showCopied = ref(false)
let copiedTimeout = null

const entities = computed(() => props.glyph.entities.match(/\S+/g) || [])

// The keyboard shortcut depends on the active layout and lives in the main process.
watch(() => props.glyph.symbol, async symbol => {
  shortcut.value = null
  const result = await api.keymap.lookup(symbol)
  if (symbol === props.glyph.symbol) shortcut.value = result
}, { immediate: true })

watch(copiedAt, () => {
  showCopied.value = true
  clearTimeout(copiedTimeout)
  copiedTimeout = setTimeout(() => {
    showCopied.value = false
  }, 1500)
})
</script>

<style lang="scss" scoped>
.glyph-data {
  &__card {
    color: rgb(var(--colorWhite));
    border-radius: 6px;
    padding: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: var(--shadowGlyphData);
    background-color: var(--colorGlyphDataBackground);
    backdrop-filter: blur(15px);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__name {
    color: rgb(var(--colorRed));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.1;
    flex: 1 1 auto;
  }

  &__icon {
    flex: 0 0 auto;
    margin-left: 2px;
    opacity: 0.4;
    transform: rotate(180deg);
    transition: transform 0.2s $ease;

    &.is-active {
      transform: rotate(0deg);
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(var(--colorWhite), 0.4);
    white-space: nowrap;
  }

  &__content {
    padding-top: 8px;
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  }

  &__item {
    margin-left: 12px;

    &:first-child {
      margin-left: 0;
    }
  }

  &__clipboard {
    position: absolute;
    left: 0;
    width: 100%;
    bottom: calc(100% + 8px);
    pointer-events: none;
  }

  &__empty {
    opacity: 0.2;
  }
}
</style>
