# Soulseekr

Soulseekr turns Spotify listening history into collectible visual artifacts. It runs as a static client-side application, includes a clearly labelled sample archive, and can export its cards as story or square images.

The studio opens directly in the sample archive so visitors can inspect and export a working artifact before connecting an account. Spotify connection is optional and replaces the sample with the listener's own ranked history for the current browser session.

## What is in the studio

The main workspace renders eight formats from the same listening data:

| Format | Visual language |
| --- | --- |
| Vinyl Obi | Japanese record sleeve with an Obi strip and side-based track list |
| Swiss Poster | Typographic concert poster with a strict information hierarchy |
| Sound Prism | Translucent listening profile with clearly labelled archive indices |
| Tape Cassette | Cassette shell, J-card, and playable track list |
| Thermal Slip | Record-bar receipt with durations and catalog details |
| Titanium DAP | Compact digital player built around the top track |
| Retro Handheld | Game Boy-inspired cartridge console with a green-tint dot-matrix LCD |
| VIP Pass | Festival credential with a listening timetable |

Connected accounts also unlock the Year in Music story and the Taste Dossier. Story soundtracks start with random picks from up to 50 ranked tracks. If a preview cannot play, unused top tracks are checked before recycling an older playable song, and the previous story's song is excluded. Year in Music uses its labelled on-device instrumental only after the eligible real candidates are exhausted; Taste Dossier never generates instrumental audio. Audio keeps the same 30-second listening budget. The dossier includes Audio DNA, cinema and synesthesia, listening-weather, listening-geography, a period comparison, and a data-provenance ledger.

## Interaction and export

- The artifact selector and listening window work with pointer or keyboard input.
- Sample mode uses the four-week window. The six-month and approximate one-year controls remain visibly disabled until Spotify is connected.
- Sample mode, the selected edition, and the selected connected window are restored within the current browser session.
- Track rows play the preview supplied by Spotify. When Spotify has no preview URL, artist and track titles are sent to Apple's public iTunes search endpoint. Results must match the artist, title, recording version, and available duration before playback; otherwise the studio reports that the preview is unavailable. Preview controls support pause/resume without resetting the position and keep a 30-second listening budget.
- Audio DNA switches its track, artist, metric, release-era, and genre datasets with the selected Spotify time horizon. Windows Spotify did not return are disabled rather than filled with sample data.
- The selected artifact can be downloaded in 9:16 or 1:1 format, or copied to the clipboard when the browser supports image clipboard access.
- Wrapped and dossier dialogs close with Escape and return focus to the control that opened them.
- Year in Music prefers different ranked previews and labels the actual soundtrack playing. The local instrumental is identified separately, never as a Spotify recording. When the browser blocks audio, Play story audio provides a user-gesture retry. Muting, closing, or changing stories cancels pending playback; concurrent preview lookups are shared.
- Manually choosing a story track cancels pending automatic selection and updates the story's rotation history. Story metadata is escaped before rendering; missing, invalid, or failed artwork keeps its layout slot without displaying broken-image boxes.
- Successful playback, not just a planned assignment, determines soundtrack history. Each story gets a distinct song when enough previews are playable. Smaller pools cycle older tracks without immediately repeating the previous story's song. Missing previews are searched in small concurrent batches across the supplied top-track pool rather than stopping after five or ten candidates.
- Taste Dossier applies the same rotation to department changes, subviews, and shuffle while audio is active. Paused audio does not restart on navigation. Failed previews fall back to different top tracks; closing, cancelling loading, shuffling, or choosing another track invalidates pending playback. If no different real preview can play, the dossier reports that instead of synthesizing audio.
- Stories advance after 15 seconds of reading time, with the timer held while a soundtrack is selected. Pause/Resume works by keyboard or pointer, holding the story temporarily pauses it, and switching browser tabs pauses the timer. Scrolling never skips stories; the recap remains open for export.
- Period Comparison contrasts Spotify's approximate four-week, six-month, and one-year affinity windows without substituting data from another window.
- If a window request fails, the last loaded archive keeps its original window label and selection. Retry requests the failed window explicitly; exports and private views use the loaded snapshot's window.
- Stop and switching tracks invalidate delayed media operations. Disconnecting stops playback and clears the previous track's audio dock.
- Weather is requested only in its dossier department. Failed permission or network requests offer a keyboard-accessible retry; the weather request times out after 12 seconds. Location is sent to Open-Meteo without Spotify history, and incomplete responses are reported as unavailable.
- The selected artifact loads before comparison history. Opening Audio DNA fetches the other windows once, with visible loading, partial-result, and retry states. Spotify requests time out after 12 seconds; rate limits respect `Retry-After` without automatic retry loops.
- Method & Sources distinguishes direct Spotify fields, local calculations, and creative Soulseekr interpretations.
- Reduced-motion preferences disable decorative transitions and the card tilt.

Spotify top items are affinity rankings, not exact stream counts. Spotify does not provide total listening minutes through the endpoints used here, so Soulseekr does not present an invented total. The provenance ledger records the endpoint, window, retrieval time, record count, and limitations for each connected archive.

Spotify artist genre tags are deprecated and can be empty. When that happens, Year in Music shows the ranked top artists instead of inventing genre classifications.

Preview acoustics are local estimates, not Spotify audio features. Frequency bands use the device sample rate and a 2048-point FFT: bass 40–180 Hz, mids 181–4000 Hz, and treble 4001–16000 Hz. Tempo appears only after at least six onset intervals spanning three seconds with at most 12% relative timing deviation; missing or inconsistent beats leave tempo unavailable. Preview RMS level is the DC-corrected waveform amplitude expressed as a percentage of digital full scale, not a musical energy score. Preview excerpts and mastering can affect both readings.

## Local development

Soulseekr has no build step.

```bash
npm ci
npm start
```

The package script runs the included Node static server at `http://127.0.0.1:5173/`. It binds to loopback and needs no server package. You can also use another static server:

```bash
python -m http.server 5173
```

Open `http://127.0.0.1:5173/`. Opening `index.html` directly is not recommended because the application uses JavaScript modules.

## Spotify authentication

Authentication uses the OAuth 2.0 Authorization Code flow with PKCE. The browser generates the verifier and challenge, exchanges the returned code for tokens, and stores the current session in local storage. No Spotify client secret is used.

Temporary authorization details and a random callback state are kept in session storage for the initiating tab and expire after 15 minutes. Refresh requests are shared while pending; temporary network or server failures retain credentials for retry, while rejected refresh credentials end the session. Disconnecting invalidates pending requests.

To use your own Spotify application:

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add every exact URL from which you will run Soulseekr to the app's redirect URI list. Localhost, `127.0.0.1`, and the deployed GitHub Pages URL count as different redirect URIs.
3. Replace `defaultClientId` in `js/spotify-api.js` with your app's client ID.
4. Request only the scopes listed in `SPOTIFY_CONFIG.scopes`.

The redirect URI is derived from the current origin and path. GitHub Pages subdirectories are preserved.

## Verification

```bash
npm run check
npm test
npm run test:browser
```

The unit suite checks authentication, preview matching, soundtrack fallbacks, delayed media races, acoustic calculations, weather failures, request timeouts, rate limits, and deferred comparison loading. The browser suite checks the eight artifact formats, real html2canvas exports and image sizes, failed and rapid window changes, disconnecting during a request or playback, comparison/weather retry, clipboard success/fallback, real Three.js initialization and WebGL fallback, Wrapped pause/navigation, missing story previews, local instrumental playback and keyboard recovery, mobile controls, feature-button recovery, and audio playback.

Browser checks require an installed Google Chrome. Set `BROWSER_PATH` to a Chromium-compatible executable if Chrome is elsewhere. Alternatively install Chromium with `node node_modules/playwright-core/cli.js install chromium` and set `BROWSER_CHANNEL=chromium`. Spotify and Apple responses, artwork, and a short audio waveform are fixtures; export and Three.js libraries use the same versions as the app. Screenshots are written to ignored `test-results/`. A real Spotify account authorization and real-world tempo accuracy still require manual verification.

The GitHub Pages workflow runs syntax, unit and browser checks before deployment. The application remains static with no production build step or server dependency.

## Project structure

```text
.
|-- DESIGN.md                 Visual direction and decision reasons
|-- PRODUCT.md                Product truth, constraints, and preserved behavior
|-- index.html                Application shell and modal containers
|-- css/
|   |-- style.css             Legacy base primitives and shell behavior
|   |-- design.css            Current editorial design system and responsive layout
|   |-- studio-v5.css         Listening-folio shell and connection gateway
|   |-- cards.css             Eight physical artifact treatments
|   |-- wrapped.css           Year in Music story
|   `-- dossier.css           Dossier and analysis views
|-- js/
|   |-- app.js                State, rendering, authentication UI, and controls
|   |-- spotify-api.js        PKCE and Spotify Web API requests
|   |-- card-renderer.js      Artifact templates
|   |-- audio-player.js       Preview lookup and playback
|   |-- audio-analysis.js     Frequency bands, RMS and preview tempo estimates
|   |-- request.js            Request deadlines and Retry-After parsing
|   |-- exporter.js           Canvas export and clipboard output
|   |-- wrapped-experience.js Year in Music controller
|   |-- dossier.js            Dossier controller
|   |-- audio-dna.js          Audio DNA visualizations
|   |-- cinema-synesthesia.js Cinema and color analysis
|   |-- weather-chaser.js     Weather view and timeline
|   `-- world-passport.js     Listening geography views
|-- .github/workflows/        GitHub Pages deployment
|-- scripts/                 Local static server and syntax checks
|-- tests/                   Unit and browser regressions
|-- package-lock.json        Locked development dependencies
`-- package.json             Development and verification commands
```

## Design system

The current direction is documented in `DESIGN.md`, with durable product constraints in `PRODUCT.md`. The interface uses a warm listening-room palette, Bodoni Moda for editorial display type, DM Sans for interface copy, and IBM Plex Mono for catalog metadata. Spotify green is reserved for Spotify connection actions.

The responsive layout has three deliberate states:

- Wide screens use a parchment catalog leaf beside the mounted artifact stage.
- Tablets reduce the rail before the layout becomes crowded.
- Phones stack the rail above the stage, keep format tabs horizontally scrollable, and turn export actions into full-width rows.

Each artifact keeps its own visual language. The surrounding application stays quiet so album art and the selected physical format remain the focal point.
