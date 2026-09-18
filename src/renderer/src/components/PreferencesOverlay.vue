<template>
  <div class="preferences-overlay">
    <div class="preferences-overlay__header">
      <h2>Preferences</h2>
      <btn icon="close" title="Close" @click="close" />
    </div>

    <div class="preferences-overlay__content">
      <div class="preferences-overlay__section">
        <label class="preferences-overlay__option">
          <span>Appearance</span>
          <select class="select" :value="settings.darkMode" @change="setSetting('darkMode', $event.target.value)">
            <option value="system">Match system</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        <label class="preferences-overlay__option">
          <span>Hide app after copying</span>
          <span class="switch">
            <input type="checkbox" :checked="settings.hideAfterCopy" @change="setSetting('hideAfterCopy', $event.target.checked)">
            <span class="switch__slider" />
          </span>
        </label>

        <label class="preferences-overlay__option">
          <span>Clear search on hide</span>
          <span class="switch">
            <input type="checkbox" :checked="settings.clearSearchOnHide" @change="setSetting('clearSearchOnHide', $event.target.checked)">
            <span class="switch__slider" />
          </span>
        </label>

        <label class="preferences-overlay__option">
          <span>Show in menu bar</span>
          <span class="switch">
            <input type="checkbox" :checked="settings.showMenubar" @change="onShowMenubarChange($event.target.checked)">
            <span class="switch__slider" />
          </span>
        </label>

        <label class="preferences-overlay__option" v-if="settings.showMenubar">
          <span>Open at login</span>
          <span class="switch">
            <input type="checkbox" :checked="settings.autoStart" @change="setSetting('autoStart', $event.target.checked)">
            <span class="switch__slider" />
          </span>
        </label>

        <div class="preferences-overlay__option" v-if="settings.showMenubar">
          <span>Shortcut</span>
          <div class="preferences-overlay__row">
            <template v-if="isListening">
              <span class="preferences-overlay__grey-text">Press shortcut</span>
              <btn @click="isListening = false">Cancel</btn>
            </template>
            <template v-else>
              <span class="preferences-overlay__keys">
                <small-key v-for="key in settings.shortcut" :key="key" :name="key" />
              </span>
              <btn @click="isListening = true">Change</btn>
            </template>
          </div>
        </div>

        <div class="preferences-overlay__option preferences-overlay__note" v-if="shortcutError">
          <span class="preferences-overlay__error-text">{{ shortcutError }}</span>
        </div>

        <div class="preferences-overlay__option" v-if="needsRestart">
          <span class="preferences-overlay__grey-text">Restart to apply changes</span>
          <btn is-red @click="api.relaunch()">Restart</btn>
        </div>
      </div>

      <div class="preferences-overlay__section">
        <div class="preferences-overlay__label">About</div>
        <div class="preferences-overlay__text">
          EmojiFinder {{ info.version }} for Apple Silicon, a fork of
          <a href="#" @click.prevent="api.openExternal('https://github.com/ueberdosis/glyphfinder')">Glyphfinder by überdosis</a>.
        </div>
      </div>

      <div class="preferences-overlay__section">
        <div class="preferences-overlay__label">Emoji cache</div>
        <div class="preferences-overlay__text">
          EmojiFinder checks once per macOS version which emojis your Mac can show. Rebuild the list after installing new fonts.
        </div>
        <btn is-red @click="clearGlyphCache">Rebuild Emoji Cache</btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Btn from '@/components/Btn.vue'
import SmallKey from '@/components/SmallKey.vue'
import { api, info } from '@/services/api'
import { useSettings } from '@/composables/useSettings'

const emit = defineEmits(['close'])

const { settings, setSetting } = useSettings()

const isListening = ref(false)
const needsRestart = ref(false)
const shortcutError = ref('')

const MODIFIER_ORDER = ['control', 'alt', 'shift', 'super']

function close() {
  emit('close')
}

function onShowMenubarChange(enabled) {
  setSetting('showMenubar', enabled)
  setSetting('autoStart', enabled)
  needsRestart.value = true
}

async function clearGlyphCache() {
  const confirmed = await api.confirm({
    message: 'Rebuild the emoji cache?',
    detail: 'EmojiFinder will check again which emojis your Mac can show. This takes a few seconds.',
    confirmLabel: 'Rebuild',
  })
  if (!confirmed) return

  await api.glyphCache.clear()
  window.location.reload()
}

// Maps a keydown to the key name Electron accelerators use, or null for modifier-only presses.
function mainKeyName(event) {
  const { code, key } = event
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase()
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) return code.toLowerCase()
  if (code === 'Space') return 'space'
  if (['Tab', 'Backspace', 'Delete', 'Enter', 'Home', 'End', 'PageUp', 'PageDown'].includes(code)) return code.toLowerCase()
  if (code.startsWith('Arrow')) return code.slice(5).toLowerCase()
  if (key.length === 1 && !/[a-z0-9\s]/i.test(key)) return key
  return null
}

async function handleKeyDown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    if (isListening.value) isListening.value = false
    else close()
    return
  }

  if (!isListening.value) return
  event.preventDefault()

  const main = mainKeyName(event)
  if (!main) return

  const modifiers = MODIFIER_ORDER.filter(modifier => ({
    control: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    super: event.metaKey,
  })[modifier])

  if (!modifiers.length) {
    shortcutError.value = 'Add at least one modifier key (⌘, ⌃, ⌥ or ⇧).'
    return
  }

  const previous = settings.shortcut
  const keys = [...modifiers, main]
  const registered = await api.shortcut.set(keys)

  if (registered) {
    shortcutError.value = ''
    isListening.value = false
  } else {
    shortcutError.value = 'macOS did not accept that shortcut. It may be taken by another app.'
    await api.shortcut.set(previous)
  }
}

onMounted(() => document.addEventListener('keydown', handleKeyDown, true))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeyDown, true))
</script>

<style lang="scss" scoped>
.preferences-overlay {
  background-color: var(--colorPreferencesOverlayBackground);
  color: rgb(var(--colorWhite));
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--menuBarSize) 16px 16px 16px;
  border-radius: 6px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    h2 {
      font-size: inherit;
      color: rgb(var(--colorRed));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.1;
      flex: 1 1 auto;
    }
  }

  &__content {
    font-size: 14px;
    font-weight: 500;
  }

  &__section {
    margin-bottom: 24px;
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: rgba(var(--colorWhite), 0.4);
    margin-bottom: 4px;
  }

  &__text {
    margin-bottom: 8px;
    line-height: 1.4;
    user-select: text;

    a {
      color: rgb(var(--colorRed));
    }
  }

  &__row {
    display: flex;
    align-items: center;
  }

  &__keys {
    display: inline-flex;
    margin-right: 8px;
  }

  &__option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-top: 1px solid rgba(var(--colorWhite), 0.05);
  }

  &__note {
    justify-content: flex-end;
    border-top: 0;
    padding-top: 0;
  }

  &__grey-text {
    color: rgba(var(--colorWhite), 0.5);
    font-style: italic;
    margin-right: 8px;
  }

  &__error-text {
    font-size: 12px;
    color: rgb(var(--colorRed));
  }
}

.select {
  background-color: rgba(var(--colorWhite), 0.1);
  border: 0;
  border-radius: 6px;
  font: inherit;
  height: 26px;
  padding: 0 4px;
  color: rgb(var(--colorWhite));
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 26px;
  flex: 0 0 auto;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  &__slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(var(--colorWhite), 0.1);
    transition: 0.2s $ease;
    border-radius: 26px;

    &::before {
      content: '';
      position: absolute;
      height: 18px;
      width: 18px;
      left: 4px;
      bottom: 4px;
      background-color: var(--colorSwitchSliderUnchecked);
      transition: 0.2s $ease;
      border-radius: 50%;
    }
  }

  &:hover input:not(:checked) + &__slider::before {
    background-color: var(--colorSwitchSliderUncheckedHover);
  }

  input:checked + &__slider {
    background-color: rgb(var(--colorGreen));

    &::before {
      transform: translateX(18px);
      background-color: var(--colorSwitchSliderChecked);
    }
  }
}
</style>
