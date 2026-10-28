# Soulseekr — Improvement Roadmap

> **Last updated:** 2026-10-28
> **Status:** In progress: P0 font and CSS token consolidation completed, critical P1 stability, accessibility, and Retro Handheld (Game Boy) edition integration completed.

---

## Project Overview

Soulseekr is a static, client-side listening studio that transforms Spotify listening history into eight collectible visual artifacts. It uses PKCE OAuth, has no build step, and is deployed to GitHub Pages. The design direction is strong: a warm editorial physical-media aesthetic backed by detailed `DESIGN.md` and `PRODUCT.md` documents.

**What's already well done:**
- Meticulous design system documentation and product constraints
- Privacy-first architecture: everything runs in-browser
- Solid PKCE OAuth implementation with token refresh
- Good accessibility foundations (ARIA roles, keyboard navigation, reduced-motion, skip links)
- Clear separation of concerns across JS modules
- Eight fully-realized, visually distinct artifact editions

---

## Issues & Improvements

### 🏗️ 1. Architecture & Code Structure

| Issue | Location | Severity |
|-------|----------|----------|
| **Conflicting CSS custom property declarations** | `css/style.css` vs `css/design.css` vs `css/studio-v5.css` | 🔴 High |
| **Monolithic `app.js`** at ~1,080 lines mixing state, rendering, auth, UI, and events | `js/app.js` | 🟡 Medium |
| **`card-renderer.js`** generates all HTML as template strings (~672 lines) | `js/card-renderer.js` | 🟡 Medium |
| **Large module complexity** (`audio-dna.js` at 2,212 lines, `dossier.js` at 1,411 lines) | `js/audio-dna.js`, `js/dossier.js` | 🟡 Medium |
| Retro Handheld (Game Boy) integration: now fully integrated as official 8th format | `index.html`, `js/card-renderer.js` | 🟢 Resolved |
| Legacy `style.css` variables (`Inter`, `Outfit`, `Space Mono`, accent-purple) conflict with the current design system | `css/style.css:6-41` | 🔴 High |

**Details on the CSS conflict:** Three different files declare `:root` with competing values for `--background`, `--foreground`, `--font-sans`, `--font-display`, `--font-mono`, and shadow tokens. Load order in `index.html` determines which wins, but `style.css` (loaded first) sets a completely different palette (`#08080a`, Inter, `Space Mono`) than the current editorial system (`#11100d`/`#171510`, DM Sans, IBM Plex Mono). This is the single biggest source of visual bugs and specificity confusion.

> **Recommended fix:** Merge `style.css` into `design.css` / `studio-v5.css` and remove the legacy file entirely, or at minimum strip out the conflicting `:root` block from `style.css`.

---

### ⚡ 2. Performance

| Issue | Impact |
|-------|--------|
| **Google Fonts request loads 9 font families** in a single `<link>` — most are unused (Outfit, Syne, Space Grotesk, Space Mono, Courier Prime) | Adds ~200–400 KB of web fonts and blocks first paint |
| **Three.js loaded synchronously** from CDN on every page load, even though it's only needed for the Year in Music 3D modal | Blocks parsing; r128 is also very outdated (current is r169) |
| **html2canvas loaded on every visit** even when the user never exports | ~100 KB deferred but still fetched |
| **No image optimization** — sample album art uses full Unsplash URLs with `w=300` but no `srcset`, `loading="lazy"`, or format hints | Wastes bandwidth on hi-DPI screens |
| **`renderCurrentCard()` is called on every playback state change** (play, pause, loading), rebuilding the entire card DOM via `innerHTML` | Kills performance and resets scroll/focus |

> **Recommendations:**
> - Load Three.js and html2canvas dynamically (`import()` or inject `<script>` on demand) only when the user opens Wrapped or triggers an export.
> - Strip unused font families from the Google Fonts URL — only Bodoni Moda, DM Sans, and IBM Plex Mono are documented.
> - Instead of full card re-render on playback changes, update only the play/pause indicator elements.

---

### 🔒 3. Security & Auth

| Issue | Location |
|-------|----------|
| **Client ID hardcoded** in source | `js/spotify-api.js:10` |
| **`localStorage` keys use the prefix `vibe_`** instead of `soulseekr_` — remnant of a prior project name | `js/spotify-api.js:17-23` |
| **PKCE verifier stored in `localStorage`** survives browser restarts; should be in `sessionStorage` | `js/spotify-api.js:79` |
| **No CSRF `state` parameter** in the OAuth flow — the PKCE spec recommends it | `js/spotify-api.js:89-98` |
| Token refresh has no retry limit — could loop on network errors | `js/spotify-api.js:252-258` |

> **Warning:** The recursive call in `spotifyFetch` (line 256) retries once on 401, but if `refreshAccessToken` succeeds and the fresh token also gets a 401, it will recurse indefinitely. Add a `retried` flag.

---

### ♿ 4. Accessibility

| Issue | Location |
|-------|----------|
| `aria-live="polite"` on the entire audio dock means every text change is announced — could be noisy | `index.html:305` |
| Spotify SVG icons in the header and gateway have no `aria-label` or `role="img"` — decorative but nested inside interactive buttons that already have labels, which is fine, but the brand badge SVG at line 53 has no label | `index.html:53-55` |
| Focus trap in the gateway modal doesn't account for recently shown/hidden elements | `js/app.js:558` |
| The card tilt effect uses inline `style.transition = 'none'` which blocks reduced-motion users from overriding via CSS | `js/app.js:787` |
| Track play triggers set `tabindex="0"` dynamically but get destroyed on every re-render, losing focus position | `js/app.js:689-717` |

> **Tip:** Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` before applying tilt transforms. The `DESIGN.md` already mandates this but the JS doesn't enforce it.

---

### 🎨 5. CSS Organization

| Issue | Detail |
|-------|--------|
| **6 CSS files totaling ~218 KB** with significant overlap and ordering dependencies | `style.css` (33 KB), `design.css` (40 KB), `studio-v5.css` (17 KB), `cards.css` (41 KB), `wrapped.css` (27 KB), `dossier.css` (60 KB) |
| `style.css` is labeled "Legacy base primitives" in the README but still sets the root palette | Should be pruned or explicitly deprecated |
| No CSS custom property namespacing — e.g., `--background` is redeclared 3 times | Fragile; any new CSS file could break the cascade |
| Media query breakpoints are not unified — each file uses its own pixel values | Maintenance risk when adjusting responsive behavior |

**Recommendation:** Consolidate the design token `:root` into a single `tokens.css` file loaded first, then layer component styles on top.

---

### 🧹 6. Code Quality & Maintenance

| Issue | Location |
|-------|----------|
| `estimateListeningMinutes()` dead function (removed) | `js/spotify-api.js` |
| Retro Handheld edition active and integrated in UI tab list and card renderer | `index.html`, `js/card-renderer.js` |
| Cache-busting via `?v=3.0` / `?v=5.0` query strings is manual: easy to forget on updates | `index.html:22-27` |
| `package.json` has no `serve` dependency: `npx serve .` works but downloads on every invocation without a lockfile | `package.json:8-9` |
| `.gitignore` includes `node_modules/` | `.gitignore` |
| Error boundary added to `renderCurrentCard` with recovery UI | `js/app.js` |

---

### 📱 7. Progressive Enhancement & Compatibility

| Issue | Recommendation |
|-------|----------------|
| No `<noscript>` fallback | Add a message explaining JS is required |
| No `manifest.json` for PWA installability | The app would benefit from offline installability given its client-side nature |
| OpenGraph tags are incomplete — no `og:image` | Generate a default share image |
| CDN dependencies (Three.js, html2canvas) have no SRI hashes | Add `integrity` + `crossorigin` attributes |
| Three.js r128 is significantly outdated | Consider upgrading or switching to a lighter WebGL approach |

---

## Priority Roadmap

| Priority | Action | Effort | Status |
|----------|--------|--------|--------|
| **P0** | Consolidate the three `:root` declarations into one canonical source | 2-3 hours | 🟢 **Completed** |
| **P0** | Remove unused Google Fonts (5 families) and update CSS fallbacks | 15 min | 🟢 **Completed** |
| **P1** | Add reduced-motion guard to the card tilt JS | 30 min | 🟢 **Completed** |
| **P1** | Fix the `spotifyFetch` recursive retry to prevent infinite loops | 15 min | 🟢 **Completed** |
| **P1** | Diff-update playback indicators instead of full `innerHTML` rebuild | 2-3 hours | 🟢 **Completed** |
| **P1** | Add error boundary around `renderCurrentCard` to prevent stage crash | 30 min | 🟢 **Completed** |
| **P1** | Fix square export canvas aspect-ratio cropping bug in `exporter.js` | 30 min | 🟢 **Completed** |
| **P1** | Delay weather geolocation in Taste Dossier until Weather tab is opened | 30 min | 🟢 **Completed** |
| **P1** | Replace fabricated lyric counts in Subconscious Mind Map with real data | 1 hour | 🟢 **Completed** |
| **P2** | Restore Retro Handheld (Game Boy) as 8th first-class edition across UI and docs | 1 hour | 🟢 **Completed** |
| **P2** | Remove dead code (`estimateListeningMinutes`) | 15 min | 🟢 **Completed** |
| **P1** | Lazy-load Three.js and html2canvas | 1-2 hours | ⬜ Not started |
| **P1** | Move PKCE verifier to `sessionStorage`; add OAuth `state` param | 1 hour | ⬜ Not started |
| **P2** | Rename `vibe_` storage keys to `soulseekr_` | 30 min | ⬜ Not started |
| **P3** | Split `dossier.js` and `audio-dna.js` into per-view modules | 3-4 hours | ⬜ Not started |
| **P3** | Add PWA manifest + `<noscript>` + SRI hashes | 1-2 hours | ⬜ Not started |
| **P3** | Add `og:image` meta tag | 30 min | ⬜ Not started |

---

## Change Log

### 2026-10-28: Session 2 (Completed P0 & Critical P1/P2 Items)

**Completed:**
- Consolidated all `:root` design tokens across `css/style.css`, `css/design.css`, and `css/studio-v5.css` into the unified warm editorial design system (`#11100d`, `#f3ebdc`, `#ef6b43`).
- Cleaned up all orphaned font references (`Space Grotesk`, `Syne`, `Courier Prime`, `Outfit`) across `cards.css`, `style.css`, and `dossier.css`.
- Fully restored and aligned the Retro Handheld (Game Boy) card edition as an official 8th format across `index.html`, `PRODUCT.md`, `README.md`, and `DESIGN.md`.
- Implemented `updateCardPlaybackUI()` in `js/app.js` to surgically update play/pause indicators and ARIA states without destroying DOM tree or losing keyboard focus on playback changes.
- Added `prefers-reduced-motion` guard to 3D card tilt and glare listeners.
- Added `try...catch` error boundary around `renderCurrentCard()` with friendly inline reset action.
- Added retry count guard to `spotifyFetch` in `js/spotify-api.js` to prevent 401 infinite loop.
- Added aspect-ratio containment scaling to `js/exporter.js` so wide formats (VIP Pass, Cassette, Retro Handheld) are not cropped in square and story exports.
- Delayed browser geolocation prompt in `js/dossier.js` until the user explicitly opens the Atmosphere & Weather tab.
- Replaced hardcoded lyric counts in `js/world-passport.js` with genuine title vocabulary analysis adhering to `PRODUCT.md` principles.
- Removed dead code `estimateListeningMinutes()`.
