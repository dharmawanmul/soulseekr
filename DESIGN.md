---
name: Soulseekr
description: A private listening folio and print-object studio for Spotify history.
colors:
  warm-black: "#11100d"
  stage-black: "#090907"
  muted-black: "#1a1814"
  surface-black: "#191713"
  ink-black: "#181611"
  bone-paper: "#f3ebdc"
  bone-paper-deep: "#e4d8c2"
  muted-copy: "#b6ae9e"
  archive-orange: "#ef6b43"
  archive-line: "#3c372e"
  control-line: "#706757"
  spotify-green: "#1ed760"
  spotify-green-hover: "#4be17c"
  focus-light: "#fff7e8"
  focus-dark: "#211e18"
typography:
  display:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "clamp(3.75rem, 7vw, 6rem)"
    fontWeight: 500
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "clamp(1.8rem, 3vw, 2.8rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "DM Sans, Segoe UI, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "DM Sans, Segoe UI, sans-serif"
    fontSize: "clamp(1rem, 1.25vw, 1.1rem)"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.012em"
  label:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
    fontSize: "0.64rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.055em"
rounded:
  square: "0"
  raised: "2px"
  dialog: "4px"
  round: "50%"
spacing:
  compact: "0.55rem"
  standard: "0.75rem"
  field: "1rem"
  section: "1.5rem"
  major: "2.25rem"
components:
  button-spotify:
    backgroundColor: "{colors.spotify-green}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.square}"
    padding: "0 1.15rem"
    height: "46px"
  button-spotify-hover:
    backgroundColor: "{colors.spotify-green-hover}"
    textColor: "{colors.ink-black}"
  edition-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.square}"
    padding: "0.68rem 0.65rem"
    height: "47px"
  edition-row-active:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.bone-paper}"
    rounded: "{rounded.square}"
  timeframe-active:
    backgroundColor: "{colors.archive-orange}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.square}"
    height: "46px"
  export-primary:
    backgroundColor: "{colors.bone-paper}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.square}"
    height: "58px"
  mounted-stage:
    backgroundColor: "{colors.stage-black}"
    textColor: "{colors.bone-paper}"
    rounded: "{rounded.square}"
    padding: "clamp(2.5rem, 6vw, 5.75rem) clamp(0.75rem, 4vw, 3.75rem)"
  gateway-dialog:
    backgroundColor: "{colors.bone-paper}"
    textColor: "{colors.ink-black}"
    rounded: "{rounded.dialog}"
---

# Design System: Soulseekr

## Overview

**Creative North Star: "The Listening Folio"**

Soulseekr is a listening folio, not a dashboard: choose an edition and window, inspect the mounted artifact, then export it. The interface combines an independent record shop, a well-kept listening room, and an editorial design studio. It should feel warm, tactile, precise, private, and slightly obsessive.

The shell behaves like a catalog leaf around one dominant physical-media object. Dense tools live on an asymmetric paper control leaf while the selected artifact receives the dark, generous stage. Hairline rules, catalog numbering, compact metadata, and controlled asymmetry create identity without competing with album artwork or the seven artifact editions.

Reading this as: an operate-mode archive studio for privacy-conscious Spotify listeners, in a warm editorial physical-media language, dial ENERGY 2 / RHYTHM 3 / MOTION 2.

**Key Characteristics:**

- Warm black workspace paired with bone-paper controls and one archive-orange accent.
- Bodoni Moda display statements, DM Sans interface copy, and IBM Plex Mono metadata.
- An asymmetric control leaf beside a mounted artifact stage, never a card-grid dashboard.
- Record grooves localized to preview and audio contexts where they describe the product.
- Restrained, task-led motion with a dedicated exception for the immersive Year in Music story.

## Colors

The palette takes its character from printed sleeves, dark listening rooms, and oxidized ink. Album art supplies the broad chromatic range; interface color stays disciplined.

### Primary

- **Archive Orange:** marks selected time windows, catalog indices, progress, and small editorial signals. It is the single interface accent.

### Secondary

- **Spotify Green:** appears only on explicit Spotify connection actions and connected-state signals. It is an external-service color, not a general success or decorative color.

### Neutral

- **Warm Black, Stage Black, and Surface Black:** establish the page, mounted preview, and dark containers as distinct tonal planes without default shadows.
- **Bone Paper and Deep Bone Paper:** form the bright control leaf, primary export action, dialog reading surface, and high-emphasis text.
- **Ink Black:** carries text and active rows on paper surfaces.
- **Muted Copy:** supports descriptions and metadata while preserving readable contrast.
- **Archive Line and Control Line:** separate regions with one-pixel rules. Control Line is for functional boundaries, not body text.
- **Focus Light and Focus Dark:** maintain visible keyboard focus on dark and paper surfaces respectively.

**The One Archive Accent Rule.** Orange is rare and structural. Use it for selection, indexing, progress, and one small identifying gesture, never as an all-purpose fill.

**The Spotify Exception Rule.** Green belongs only to Spotify connection or an explicit Spotify state. Export, navigation, artifact selection, and generic success remain inside the archive palette.

**The Artwork Carries Color Rule.** Let album artwork and the artifact editions provide color variety. Keep the surrounding studio materially quiet.

## Typography

**Display Font:** Bodoni Moda (with Georgia fallback)

**Body Font:** DM Sans (with Segoe UI fallback)

**Label/Mono Font:** IBM Plex Mono (with Consolas fallback)

**Character:** High-contrast display type recalls record sleeves and arts publishing. The sans remains clear in dense controls, while the mono face turns provenance, measurements, and catalog labels into evidence rather than decoration.

### Hierarchy

- **Display:** medium-weight Bodoni with a tight line and compact tracking. Reserve it for the studio statement, gateway proposition, and the largest story moments.
- **Headline:** semibold Bodoni for selected-edition titles, dialog headings, and view titles.
- **Title:** bold DM Sans for control headings and action labels that must scan quickly.
- **Body:** regular DM Sans with generous leading. Keep explanatory text near 32 to 56 characters wide where layout permits.
- **Label:** medium IBM Plex Mono, usually small and moderately tracked. Use it for catalog numbers, indices, provenance, timeframe labels, and measurements, not paragraphs or oversized headlines.

**The Three Voices Rule.** Bodoni names the artifact, DM Sans operates the studio, and IBM Plex Mono verifies the archive. Do not exchange those roles casually.

**The Quiet Metadata Rule.** Metadata follows the heading it qualifies and stays visibly subordinate through size, weight, and spacing. It must never compete with the artifact name.

## Layout

The page is capped at 1500px and uses fluid outer padding. Its opening statement is asymmetric: a large editorial heading sits against a narrower explanatory column. The workbench is a bordered two-column object with a fixed 304px paper control leaf and a flexible mounted stage. The stage heading pairs the selected edition with its description before the preview, followed by a horizontal export colophon.

Spacing alternates compact tool density with generous artifact space. Controls use short, repeated intervals; the intro and preview use larger fluid intervals. This contrast makes the interface feel like a real bench where tools stay close and the object gets room.

- **Wide screens:** keep the control leaf and preview side by side. The control leaf may stay sticky while the artifact remains the focal point.
- **Below 1160px:** the header navigation becomes a full second row so labels and session actions remain comfortable.
- **Below 940px:** stack the control leaf above the preview. Turn the seven-edition selector into a horizontally scrollable, snap-aligned row and expose the swipe or arrow-key hint.
- **Below 700px:** stack the intro, stage heading, export dock, and connection gateway. Export actions become full-width rows and the gateway scrolls within the dynamic viewport.
- **Below 520px:** tighten page and panel padding, wrap long labels, keep the three time windows equal, and preserve the artifact canvas without horizontal overflow.

Year in Music and Taste Dossier are full-screen archive rooms rather than dashboard pages. Their dense internal grids collapse progressively, navigation remains reachable, and their content never changes the main studio's hierarchy.

**The Artifact First Rule.** At every width, the current artifact is the single focal point. Controls, copy, and exports clarify it rather than form competing cards.

**The Mobile Discovery Rule.** On stacked layouts, every edition remains discoverable through horizontal scrolling, snap alignment, visible instruction, and keyboard arrow behavior.

## Elevation & Depth

Soulseekr is flat by default. Tonal planes, hairline borders, overlap, and scale establish hierarchy. Shadows are reserved for elements that truly detach from the workbench: the connection gateway, its record object, the floating audio dock, and transient notifications. Artifact editions may use their own material depth inside the mounted preview.

### Shadow Vocabulary

- **Gateway lift** (`0 34px 90px rgba(0, 0, 0, 0.5)`): separates the authentication decision from the studio.
- **Gateway record lift** (`0 24px 44px rgba(0, 0, 0, 0.45)`): makes the record cover object feel physical inside the gateway.
- **Floating utility** (`0 16px 50px rgba(0, 0, 0, 0.4)`): lifts the audio dock above content while a preview is active.
- **Transient notice** (`0 18px 50px rgba(0, 0, 0, 0.28)`): gives toasts enough separation to read as temporary system feedback.

Motion follows the same hierarchy. Most state transitions finish in about 110 to 160ms. The audio dock uses a 320ms sheet-like entrance, dialog overlays use short opacity and transform transitions, and physical card tilt responds directly to pointer movement. Under reduced motion, animations collapse, card tilt is removed, and specular glare is hidden.

**The Flat Workbench Rule.** Do not give stationary navigation, selectors, panels, or export rows floating shadows. Use a line or tonal step first.

**The Motion Has a Job Rule.** Motion may confirm a selection, introduce a temporary layer, indicate active playback, or support the dedicated story. Decorative loops and page-wide reveals do not belong in the studio.

## Shapes

The form language is rectilinear and print-led. Buttons, segmented controls, navigation rows, tabs, and fields use square corners. Raised utilities such as toasts, modal internals, and the audio dock may use a restrained 2px radius; the gateway shell uses 4px. Circles are reserved for record geometry, album art, profile imagery, and other content whose meaning is genuinely round.

One-pixel rules create sections and states. Avoid soft floating cards, broad capsules, and repeated rounded containers. Each artifact edition owns its own silhouette, including sleeves, posters, prisms, cassettes, slips, players, and passes; the shell must not force them into one generic card shape.

**The Meaningful Circle Rule.** A circle must describe a record, avatar, center label, or playback object. It is not a general decoration.

**The Local Groove Rule.** Repeating radial grooves belong behind the mounted preview, inside the gateway record, and on audio surfaces. Never turn them into a page-wide wallpaper.

## Components

### Masthead and Navigation

- The sticky masthead contains the record-mark wordmark, the two private archive rooms, connection status, and the Spotify action.
- Archive-room buttons are flat and receive a short orange underline on hover. Locked state is communicated with a lock icon, muted copy, and explanatory title, not color alone.
- At narrower widths, personal views move to their own row while the brand and session action stay above.

### Buttons

- **Shape:** square corners, compact horizontal padding, and a minimum 44px interaction target.
- **Spotify action:** Spotify Green with dark ink and bold labeling. Hover lightens slightly; this treatment is exclusive to connection.
- **Primary export:** Bone Paper with Ink Black. Secondary exports stay transparent with line separation.
- **Secondary action:** transparent with a Control Line border; invert to paper or ink only when hierarchy needs a clear hover response.
- **Focus:** a two-pixel visible outline with offset. Use Focus Light on dark surfaces and Focus Dark on paper.

### Edition and Time Selectors

- Edition choices are a vertical ruled tab list on wide screens and a horizontal scroll strip below the workbench breakpoint.
- The active edition reverses to Ink Black on the paper leaf, with a short orange rule and orange icon detail. Selection updates the stage heading and artifact together.
- Time windows form a three-column radio group. The active window uses Archive Orange and dark ink; unavailable connected windows remain disabled rather than receiving sample substitutions.
- Keyboard operation, selected state, and focus state must remain synchronized with the visible state.

### Mounted Artifact Stage

- The stage is the deepest black plane, framed by a one-pixel archive line and a localized record-groove field.
- A small mono mount label sits at the lower edge. The selected edition name and descriptive metadata sit above the stage, not over the artifact.
- The preview container is capped near 460px while the surrounding stage remains generous. Each of the seven editions keeps its own internal typography, material, and interaction behavior.
- Empty, loading, and error states use the same stage and explain what is happening and what the listener can do next.

### Export Dock

- The dock reads like a colophon: an explanatory block followed by Story, Square, and Clipboard actions.
- Desktop actions share one ruled row; phone actions stack. The leading download is the paper-filled primary action.
- Export copy names the actual result and aspect ratio. Feedback appears through toasts with text, not color alone.

### Connection Gateway

- The gateway is a split listening-object cover: warm-black record art on one side and a bone-paper decision surface on the other.
- The cover uses one vertical orange band and localized grooves. Spotify Green appears only on the connection button; the sample archive remains a bordered ink-and-paper alternative.
- Security copy stays factual and compact: client-side PKCE, read-only access, and no stored Spotify password. The dialog closes with its button, backdrop behavior, and Escape, and returns focus appropriately.
- On phones, the cover compresses into a short masthead, the content stacks, and the dialog scrolls inside `100dvh` bounds.

### Audio Dock, Year in Music, and Taste Dossier

- The audio dock is a small bone-paper floating utility with album art, truncated track metadata, playback state, and 44px controls. Its motion signals entry, exit, and playback only.
- Year in Music is the intentional motion-rich exception. It uses a bounded dark stage, progress segments, clear previous and next controls, soundtrack status, and Escape-close behavior.
- Taste Dossier is a denser archive room. It retains the same paper, ink, orange, rules, type roles, direct versus derived provenance language, and responsive stacking.

### Status and Feedback

- Sample mode must be named as a sample archive wherever it can be mistaken for connected data.
- Toasts are compact bone-paper notices with a narrow semantic edge and plain-language feedback.
- Loading, empty, disabled, locked, error, and success states remain visible, keyboard-safe, and textually explicit.

## Do's and Don'ts

### Do:

- **Do** make the selected artifact the brightest and most memorable object on the studio screen.
- **Do** preserve the full workflow: choose one of seven editions, choose a listening window, inspect the mounted preview, then export it.
- **Do** use Archive Orange sparingly for selection, indexing, progress, and catalog detail.
- **Do** reserve Spotify Green for explicit connection actions and Spotify state.
- **Do** keep Bodoni, DM Sans, and IBM Plex Mono in their established display, interface, and metadata roles.
- **Do** keep controls at least 44px, expose visible focus, support logical keyboard order, and honor reduced motion.
- **Do** label sample data, locked features, disabled time windows, loading, empty, and error states in plain language.
- **Do** distinguish direct Spotify fields, local calculations, and creative interpretations in the dossier.

### Don't:

- **Don't** turn the studio into a dashboard, a bento grid, or a wall of equal cards.
- **Don't** use Spotify Green for export, navigation, general success, decorative glow, or artifact styling.
- **Don't** spread grooves, grids, blur, glow, large shadows, rounded pills, or orange fills across the whole interface.
- **Don't** place explanatory metadata above or at the same weight as the heading it qualifies.
- **Don't** homogenize the seven artifact editions into one generic card template.
- **Don't** imply that Spotify affinity rankings are stream counts, total minutes, or any unsupported measurement.
- **Don't** disguise sample data as connected data or substitute sample values into unavailable connected windows.
- **Don't** add decorative perpetual motion. Keep the studio restrained and let Year in Music own the richer choreography.
