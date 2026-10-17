# Soulseekr design direction

Soulseekr is a private listening archive that turns Spotify history into collectible print objects. It should feel like an independent record shop, a well-kept listening room, and an editorial design studio sharing one workspace.

## Character

- Elegant, tactile, curious, and slightly obsessive.
- Editorial rather than futuristic.
- Precise without becoming clinical.
- The generated artifact is always the focal point.

## Visual language

- Warm ink surfaces, parchment text, and oxidized orange as the editorial accent.
- Spotify green appears only where the interface is explicitly asking the user to connect Spotify.
- A localized record-groove motif grounds the preview stage. It is not used as a page-wide pattern.
- Fine rules, catalog numbers, and asymmetric composition create the archive identity.

## Typography

- Bodoni Moda for the Soulseekr wordmark and large editorial statements. Its sharp contrast recalls record sleeves and arts publishing.
- DM Sans for interface copy because it stays clear at small sizes without feeling like a generic system dashboard.
- IBM Plex Mono for catalog metadata and measurements, never for large headings.

## Layout

- Desktop uses an asymmetric catalog workbench: controls on a narrow rail, the selected artifact on a generous stage.
- Tablet rebalances the rail and stage before mobile stacks them.
- Mobile keeps the artifact selector horizontally scrollable and gives every action a 44px minimum target.

## Motion

Dial: ENERGY 2 / RHYTHM 3 / MOTION 2.

Motion is reserved for direct feedback, modal entry, the physical card tilt, and the dedicated 3D listening story. Decorative perpetual animation is avoided, and reduced-motion preferences are respected.

## Decision reasons

- Color: the warm palette belongs to physical media and makes album artwork, not interface chrome, carry the brightest color.
- Layout: the catalog rail keeps the controls legible while giving the selected artifact a dominant stage.
- Typography: editorial contrast gives Soulseekr a recognizable voice while the sans and mono faces keep dense controls readable.
- Spacing: compact controls and generous stage space mirror a real studio bench, where tools stay close and the object gets room.
- Cards: card surfaces are used only for actual artifacts, modals, and raised notifications. Navigation stays flat.
- Motif: record grooves appear only behind the artifact preview, tying decoration directly to the product.
