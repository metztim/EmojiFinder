// electron-builder afterPack hook.
// The build is not signed with a Developer ID (identity: null), and Apple Silicon refuses to run
// unsigned code, so give the bundle an ad-hoc signature. That is enough for a locally built app.
const { execFileSync } = require('node:child_process')
const path = require('node:path')

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  const appName = `${context.packager.appInfo.productFilename}.app`
  const appPath = path.join(context.appOutDir, appName)

  execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' })
  console.log(`  • ad-hoc signed ${appName}`)
}
