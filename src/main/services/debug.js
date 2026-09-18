import fs from 'node:fs'
import { app } from 'electron'

// Headless smoke testing. Enabled only when EMOJIFINDER_DEBUG_ACTIONS holds a JSON list of steps:
//   { "type": "wait", "ms": 500 }
//   { "type": "query", "value": "arrow" }        types into the search field
//   { "type": "key", "key": "Down" }              sendInputEvent keyDown/keyUp, Electron key names
//   { "type": "click", "selector": ".button" }
//   { "type": "eval", "js": "document.title" }    logs the result
//   { "type": "prefs" }                            opens the preferences overlay
//   { "type": "shot", "path": "/tmp/a.png" }
//   { "type": "quit" }
// Renderer console output is mirrored to stdout while the harness runs.
export function debugActions() {
  const raw = process.env.EMOJIFINDER_DEBUG_ACTIONS
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error('EMOJIFINDER_DEBUG_ACTIONS is not valid JSON', error)
    return null
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export async function runDebugActions(win, actions, { show }) {
  const { webContents } = win

  webContents.on('console-message', event => {
    const { level, message, lineNumber, sourceId } = event
    console.log(`[renderer:${level}] ${message} (${sourceId}:${lineNumber})`)
  })

  process.on('unhandledRejection', error => console.log(`[debug] unhandled rejection: ${error && error.stack}`))

  console.log(`[debug] isLoading=${webContents.isLoading()} url=${webContents.getURL()}`)
  await new Promise(resolve => {
    if (!webContents.isLoading()) return resolve()
    webContents.once('did-stop-loading', resolve)
    setTimeout(resolve, 5000)
  })
  console.log('[debug] load wait done')

  try {
    await show()
    console.log('[debug] window shown')
  } catch (error) {
    console.log(`[debug] show failed: ${error && error.stack}`)
  }
  await sleep(300)

  for (const action of actions) {
    console.log(`[debug] step ${action.type}`)
    switch (action.type) {
      case 'wait':
        await sleep(action.ms || 500)
        break
      case 'query':
        await webContents.executeJavaScript(`(() => {
          const input = document.querySelector('.glyph-wrapper__search')
          if (!input) return 'no search input'
          input.focus()
          input.value = ${JSON.stringify(action.value)}
          input.dispatchEvent(new Event('input', { bubbles: true }))
          return 'ok'
        })()`).then(result => console.log(`[debug] query "${action.value}": ${result}`))
        break
      case 'key':
        webContents.sendInputEvent({ type: 'keyDown', keyCode: action.key, modifiers: action.modifiers || [] })
        webContents.sendInputEvent({ type: 'keyUp', keyCode: action.key, modifiers: action.modifiers || [] })
        await sleep(80)
        break
      case 'click':
        await webContents.executeJavaScript(`(() => {
          const element = document.querySelector(${JSON.stringify(action.selector)})
          if (!element) return 'not found'
          element.click()
          return 'ok'
        })()`).then(result => console.log(`[debug] click ${action.selector}: ${result}`))
        break
      case 'eval':
        await webContents.executeJavaScript(action.js)
          .then(result => console.log(`[debug] eval: ${JSON.stringify(result)}`))
          .catch(error => console.log(`[debug] eval failed: ${error.message}`))
        break
      case 'prefs':
        webContents.send('preferences:show')
        await sleep(700)
        break
      case 'shot': {
        const image = await webContents.capturePage()
        fs.writeFileSync(action.path, image.toPNG())
        console.log(`[debug] screenshot ${action.path} (${image.getSize().width}x${image.getSize().height})`)
        break
      }
      case 'quit':
        app.exit(0)
        return
      default:
        console.log(`[debug] unknown action ${action.type}`)
    }
  }
}
