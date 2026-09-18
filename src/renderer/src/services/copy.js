import { ref } from 'vue'
import { api } from '@/services/api'
import { useSettings } from '@/composables/useSettings'

const { settings, recordUsage } = useSettings()

// Bumps every time something was copied while the window stays open; the glyph card shows a badge.
export const copiedAt = ref(0)

function notifyCopied() {
  if (typeof Notification === 'undefined') return
  const notification = new Notification('EmojiFinder', { body: 'Copied to clipboard!', silent: true })
  setTimeout(() => notification.close(), 2000)
}

export function copyText(text) {
  api.copyText(text)
  copiedAt.value = Date.now()
}

export function copyGlyph(glyph) {
  api.copyText(glyph.symbol)
  recordUsage(glyph.symbol)

  if (settings.hideAfterCopy) {
    api.hide()
    notifyCopied()
  } else {
    copiedAt.value = Date.now()
  }
}
