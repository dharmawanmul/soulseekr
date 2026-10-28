# Soulseekr

Soulseekr turns Spotify listening history into collectible visual artifacts. It runs as a static client-side application, includes a clearly labelled sample archive, and can export its cards as story or square images.

The studio opens directly in the sample archive so visitors can inspect and export a working artifact before connecting an account. Spotify connection is optional and replaces the sample with the listener's own ranked history for the current browser session.

## What is in the studio

The main workspace renders seven formats from the same listening data:

| Format | Visual language |
| --- | --- |
| Vinyl Obi | Japanese record sleeve with an Obi strip and side-based track list |
| Swiss Poster | Typographic concert poster with a strict information hierarchy |
| Sound Prism | Translucent listening profile with clearly labelled archive indices |
| Tape Cassette | Cassette shell, J-card, and playable track list |
| Thermal Slip | Record-bar receipt with durations and catalog details |
| Titanium DAP | Compact digital player built around the top track |
| VIP Pass | Festival credential with a listening timetable |

Connected accounts also unlock the Year in Music story and the Taste Dossier. Each story soundtrack is randomly drawn without replacement from up to 50 ranked tracks and is capped at a 30-second preview. The dossier includes Audio DNA, cinema and synesthesia, listening-weather, listening-geography, a period comparison, and a data-provenance ledger.

## Interaction and export

- The artifact selector and listening window work with pointer or keyboard input.
- Sample mode uses the four-week window. The six-month and approximate one-year controls remain visibly disabled until Spotify is connected.
- Sample mode, the selected edition, and the selected connected window are restored within the current browser session.
- Track rows play the preview supplied by Spotify. When Spotify has no preview URL, the audio player checks the public iTunes search endpoint for an available preview. Preview controls support pause/resume without resetting the position and keep a 30-second listening budget.
- Audio DNA switches its track, artist, metric, release-era, and genre datasets with the selected Spotify time horizon. Windows Spotify did not return are disabled rather than filled with sample data.
- The selected artifact can be downloaded in 9:16 or 1:1 format, or copied to the clipboard when the browser supports image clipboard access.
- Wrapped and dossier dialogs close with Escape and return focus to the control that opened them.
- Each Year in Music story uses a different unique ranked track when enough tracks are available.
- Period Comparison contrasts Spotify's approximate four-week, six-month, and one-year affinity windows without substituting data from another window.
- Method & Sources distinguishes direct Spotify fields, local calculations, and creative Soulseekr interpretations.
- Reduced-motion preferences disable decorative transitions and the card tilt.

Spotify top items are affinity rankings, not exact stream counts. Spotify does not provide total listening minutes through the endpoints used here, so Soulseekr does not present an invented total. The provenance ledger records the endpoint, window, retrieval time, record count, and limitations for each connected archive.

Spotify artist genre tags are deprecated and can be empty. When that happens, Year in Music shows the ranked top artists instead of inventing genre classifications.

## Local development

Soulseekr has no build step.

```bash
npm start
```

The package script runs a static server. You can also use another static server:

```bash
python -m http.server 5173
```

Open `http://127.0.0.1:5173/`. Opening `index.html` directly is not recommended because the application uses JavaScript modules.

## Spotify authentication

Authentication uses the OAuth 2.0 Authorization Code flow with PKCE. The browser generates the verifier and challenge, exchanges the returned code for tokens, and stores the current session in local storage. No Spotify client secret is used.

To use your own Spotify application:

1. Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Add every exact URL from which you will run Soulseekr to the app's redirect URI list. Localhost, `127.0.0.1`, and the deployed GitHub Pages URL count as different redirect URIs.
3. Replace `defaultClientId` in `js/spotify-api.js` with your app's client ID.
4. Request only the scopes listed in `SPOTIFY_CONFIG.scopes`.

The redirect URI is derived from the current origin and path. GitHub Pages subdirectories are preserved.

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
|   |-- cards.css             Seven physical artifact treatments
|   |-- wrapped.css           Year in Music story
|   `-- dossier.css           Dossier and analysis views
|-- js/
|   |-- app.js                State, rendering, authentication UI, and controls
|   |-- spotify-api.js        PKCE and Spotify Web API requests
|   |-- card-renderer.js      Artifact templates
|   |-- audio-player.js       Preview lookup and playback
|   |-- exporter.js           Canvas export and clipboard output
|   |-- wrapped-experience.js Year in Music controller
|   |-- dossier.js            Dossier controller
|   |-- audio-dna.js          Audio DNA visualizations
|   |-- cinema-synesthesia.js Cinema and color analysis
|   |-- weather-chaser.js     Weather view and timeline
|   `-- world-passport.js     Listening geography views
|-- .github/workflows/        GitHub Pages deployment
`-- package.json              Static-server scripts
```

## Design system

The current direction is documented in `DESIGN.md`, with durable product constraints in `PRODUCT.md`. The interface uses a warm listening-room palette, Bodoni Moda for editorial display type, DM Sans for interface copy, and IBM Plex Mono for catalog metadata. Spotify green is reserved for Spotify connection actions.

The responsive layout has three deliberate states:

- Wide screens use a parchment catalog leaf beside the mounted artifact stage.
- Tablets reduce the rail before the layout becomes crowded.
- Phones stack the rail above the stage, keep format tabs horizontally scrollable, and turn export actions into full-width rows.

Each artifact keeps its own visual language. The surrounding application stays quiet so album art and the selected physical format remain the focal point.
