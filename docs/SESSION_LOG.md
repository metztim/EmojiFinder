# Session Log

---

## Session Log: 2026-09-18 - emojifinder-apple-silicon-rebuild

**Project**: EmojiFinder (`/Users/timmetz/Developer/Projects/Personal/EmojiFinder`)
**Session ID**: a80c5b92-23ae-4332-adeb-6a978a752409
**Account**: personal
**Started / saved**: 2026-09-18T04:00:58.476Z / 2026-09-18T12:45:24+0700

### Summary
Tim asked for a version of Glyphfinder (Intel-only Electron 8 app from 2020, no longer starts without Rosetta) that runs on his M5 MacBook Pro. Recovered the app from the bundle's source maps, then found and cloned the archived upstream repo and rebuilt it as EmojiFinder on Electron 40, Vue 3, and electron-vite for arm64, keeping the original design. Added ranked search, a refreshed emoji dataset (Unicode 17), an automatic font-support cache, and a headless test harness; removed the license key check and renamed the app at Tim's request. Published the repo and a v1.0.0 release with DMG on GitHub, added the project to timmetz.nl, installed the app at /Applications/EmojiFinder.app.

### Decisions
- Rebuilt on a modern stack instead of porting the Vue CLI 4 setup, because the old toolchain does not run on Node 22 and the components are small.
- Kept license validation at first, then removed it when Tim said the app is free; the upstream license asks that it stay, so the README states this plainly and suggests asking überdosis before wider distribution.
- Licensed only the fork's own additions under MIT (`LICENSE`); upstream code stays under `LICENSE-GLYPHFINDER.md`, because Tim cannot relicense überdosis's work.
- Renamed to EmojiFinder with bundle ID `com.timmetz.emojifinder` and a one-time import of Glyphfinder settings and usage, so the old app's data stays untouched.
- Search results are ranked in the worker (exact name, whole-word tag, emoji +45, curated sets +25, usage, skin-tone variants -20) because dataset-order results buried obvious emoji, which was Tim's long-standing complaint.
- Ad-hoc signing only; Developer ID plus notarization deferred until Tim provides notarization credentials.
- Kept the repo public after confirming upstream is dormant: archived Oct 2022, last version 1.4.1, delisted from Setapp, domain lapsed, no Apple Silicon build.

### Files changed
- `src/main/` - Electron main process: window and menubar, settings store, theme, keymap, login item, IPC, legacy settings import, debug harness
- `src/preload/index.js` - contextBridge API exposed as `window.emojifinder`
- `src/renderer/` - Vue 3 app: components, navigation composable, glyph service, search worker, styles, dataset
- `scripts/build-data.mjs` - merges upstream dataset with emojibase-data 17 (765 emoji added)
- `scripts/after-pack.cjs` - ad-hoc codesign after electron-builder pack
- `electron.vite.config.js`, `electron-builder.yml`, `package.json` - build and packaging
- `.github/workflows/release.yml` - builds and attaches the DMG on version tags (ran green)
- `README.md`, `LICENSE`, `LICENSE-GLYPHFINDER.md` - docs, MIT for fork changes, upstream license kept
- `/Users/timmetz/Developer/Projects/Personal/timmetz-nl/src/content/projects/emojifinder.md` - project page on timmetz.nl (pushed, deploys via Cloudflare Pages)

### Referenced
- `/Applications/Glyphfinder.app` - original Intel bundle; app.asar source maps gave the renderer source before the upstream repo was found
- https://github.com/ueberdosis/glyphfinder - archived upstream source (SCSS, main process, generator, dataset)
- https://github.com/metztim/EmojiFinder - published fork; release v1.0.0 with `EmojiFinder-1.0.0-arm64.dmg`
- `~/Library/Application Support/Glyphfinder/config.json` - Tim's Glyphfinder settings and 501-entry usage history, imported on first launch
- `/Users/timmetz/Developer/Projects/Personal/timmetz-nl/CLAUDE.md` - site conventions and project content schema
- `https://setapp.com/apps/glyphfinder`, `https://www.glyphfinder.com` - both gone; evidence upstream is dormant

### Open items
- [ ] Ask überdosis (support@glyphfinder.com) whether they are fine with the removed license check and the MIT-licensed fork additions, if the app is to be shared widely
- [ ] Developer ID signing and notarization for a frictionless download; needs an App Store Connect API key or app-specific password from Tim
- [ ] Optionally delete `/Applications/Glyphfinder.app` and its login item
- [ ] Consider a new app icon; the fork still uses the Glyphfinder icon

### Continuation prompt
Read `docs/SESSION_LOG.md`, section "## Session Log: 2026-09-18 - emojifinder-apple-silicon-rebuild" (Session ID a80c5b92-23ae-4332-adeb-6a978a752409). Context: EmojiFinder 1.0.0 is published and installed; source, release, and website page are live. Continue with: notarization or an icon if Tim wants them, otherwise maintenance. Paths: `src/renderer/src/workers/search.worker.js` (ranking), `scripts/build-data.mjs` (dataset), `electron-builder.yml`.

<!-- END_OF_SESSION_LOG -->
