# Soulseekr

Soulseekr turns Spotify listening history into collectible visual artifacts. It runs as a static client-side application, includes a clearly labelled sample archive, and can export its cards as story or square images.

## What is in the studio

The main workspace renders seven formats from the same listening data:

| Format | Visual language |
| --- | --- |
| Vinyl Obi | Japanese record sleeve with an Obi strip and side-based track list |
| Swiss Poster | Typographic concert poster with a strict information hierarchy |
| Sound Prism | Translucent listening profile with audio-feature measurements |
| Tape Cassette | Cassette shell, J-card, and playable track list |
| Thermal Slip | Record-bar receipt with durations and catalog details |
| Titanium DAP | Compact digital player built around the top track |
| VIP Pass | Festival credential with a listening timetable |

Connected accounts also unlock the Year in Music story and the Taste Dossier. The dossier includes the Audio DNA, cinema and synesthesia, listening-weather, and listening-geography views.

## Interaction and export

- The artifact selector and listening window work with pointer or keyboard input.
- Track rows play the preview supplied by Spotify. When Spotify has no preview URL, the audio player checks the public iTunes search endpoint for an available preview.
- The selected artifact can be downloaded in 9:16 or 1:1 format, or copied to the clipboard when the browser supports image clipboard access.
- Wrapped and dossier dialogs close with Escape and return focus to the control that opened them.
- Reduced-motion preferences disable decorative transitions and the card tilt.

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
|-- index.html                Application shell and modal containers
|-- css/
|   |-- style.css             Legacy base primitives and shell behavior
|   |-- design.css            Current editorial design system and responsive layout
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

The current direction is documented in `DESIGN.md`. The interface uses a warm listening-room palette, Bodoni Moda for editorial display type, DM Sans for interface copy, and IBM Plex Mono for catalog metadata. Spotify green is reserved for Spotify connection actions.

The responsive layout has three deliberate states:

- Wide screens use a narrow catalog rail beside the artifact stage.
- Tablets reduce the rail before the layout becomes crowded.
- Phones stack the rail above the stage, keep format tabs horizontally scrollable, and turn export actions into full-width rows.

Each artifact keeps its own visual language. The surrounding application stays quiet so album art and the selected physical format remain the focal point.
