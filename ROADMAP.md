# Soulseekr Improvement Roadmap

Last updated: 2026-10-29

This is the current implementation status. Completed work is separated from remaining work; the earlier audit's descriptions of fixed defects have been retired.

## Completed review items

| Item | Result | Main files |
| --- | --- | --- |
| 1. Wrapped initialization | Correct slide method/index, WebGL initialization checks and graceful background failure. | `js/wrapped-experience.js` |
| 2. Overlapping window requests | Captured ranges and request generations prevent late responses from replacing the selected window or restoring data after disconnect. | `js/app.js` |
| 3. Authentication recovery | Per-tab PKCE transaction, callback state/expiry validation, shared refresh, bounded 401 retry and retained credentials during temporary failures. Canonical entry URL avoids duplicate initialization. | `js/spotify-api.js`, `index.html` |
| 4. Wrapped controls | Ten-second dwell, accessible Pause/Resume, hold pause, hidden-tab pause, explicit navigation, scrollable panels and indefinite final recap. | `js/wrapped-experience.js`, `css/wrapped.css` |
| 5. Preview matching | Artist/title/version/duration matching; unavailable feedback instead of substituted synthesized audio; Apple lookup disclosure. | `js/audio-player.js`, `index.html` |
| 6. Acoustic estimates | Sample-rate-aware bands, consistent-onset tempo gate and explicit RMS full-scale reference. Neither reading is presented as Spotify energy or full-song ground truth. | `js/audio-analysis.js`, `js/audio-player.js`, card/story renderers |
| 7. Deferred comparisons | Four selected-window requests first. Audio DNA loads comparison windows on demand, shares pending work, caches successful windows and retries missing ones. Request deadlines and rate-limit wait times are enforced. | `js/spotify-api.js`, `js/request.js`, `js/dossier.js` |
| 8. Repeatable verification | Syntax, unit and browser commands, pinned development dependencies and lockfile, built-in Node development server, reconciled roadmap and checks before deployment. | `package.json`, `package-lock.json`, `scripts/`, `tests/`, `.github/workflows/deploy.yml` |

## Existing improvements retained

- Immediate, labelled sample archive and optional Spotify connection gateway.
- Eight artifact editions, including Retro Handheld.
- Edition/window persistence within the browser session.
- Keyboard navigation, visible focus, dialog dismissal and focus return.
- Playback indicators update without rebuilding the artifact DOM.
- Reduced-motion guard for card tilt.
- Aligned editorial palette and the three documented font families.
- Three.js and html2canvas load only when needed.
- Aspect-contained card, story, square and gallery-poster exports.
- Provenance distinguishes Spotify fields, local calculations and interpretations.
- Location is requested only when the weather department is opened.

## Verification

```sh
npm ci
npm run check
npm test
npm run test:browser
```

The browser suite requires installed Google Chrome, or a Chromium executable supplied through `BROWSER_PATH`. It starts and stops its own loopback server. External catalog responses and artwork are fixtures; actual application versions of html2canvas and Three.js are exercised. Screenshots go to ignored `test-results/`.

Coverage includes invalid/expired OAuth callbacks, offline refresh recovery, logout during refresh, repeated API rejection, preview mismatches, silent/irregular audio, sample-rate changes, deferred/cached/failed comparisons, timeouts, rate limits, all eight artifact renders/exports, aspect presets, rapid range changes, disconnect during loading, Wrapped initialization/fallback and pause controls, mobile controls, and audio playback.

## Remaining work

| Priority | Work | Why it remains |
| --- | --- | --- |
| P1 before public release | Real-account Spotify authorization and representative account/device smoke tests. | Fixtures cannot validate dashboard redirects, account permissions, live catalog coverage or device audio policies. |
| P2 | Calibrate preview tempo against a labelled, diverse audio dataset. | Consistent onsets support an estimate, not proof of musical tempo. Half/double tempo and percussion-poor excerpts remain limitations. |
| P2 | Safari/Firefox, touch gestures, screen readers and 200% text across dossier views. | Repeatable browser checks currently target Chrome with desktop and mobile viewports. |
| P2 | Weather retry recovery and location-provider disclosure near the request. | Denied/failed weather results remain cached for the dossier instance. |
| P2 | Consolidate legacy CSS rules and split large dossier/Audio DNA modules. | Shared tokens are aligned; layered stylesheets and large modules still add maintenance effort. |
| P2 | Third-party script integrity/self-hosting and storage-key migration. | Runtime CDN resources and legacy `vibe_` token names remain; changes need a compatibility pass. |
| P3 | Social sharing metadata; install/offline support if product demand warrants it. | Product enhancements rather than prerequisites for the current workflow. |

Automated checks do not imply real-account authorization, production deployment or certified acoustic accuracy.
