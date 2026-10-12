# 🎧 SoundWrapped — Experiential Spotify Wrapped Web App

> **Beyond flat receipts.** Turn your Spotify listening history into dynamic, aesthetic cultural artifacts: **Festival Lineup Posters**, **Cosmic Sound DNA**, **90s Cassette Mixtapes**, **8-Bit Retro Arcade Leaderboards**, and **Thermal Receipts 2.0**.

Built with modern Vanilla HTML/CSS/JavaScript and **Spotify PKCE OAuth 2.0**.  
Designed to run **100% serverless** and deploy effortlessly to **GitHub Pages** for free!

---

## ✨ Features That Make It Unique

| Experience Card | Aesthetic & Archetype | Unique Interaction |
| :--- | :--- | :--- |
| 🎪 **Festival Lineup** | Coachella / Glastonbury massive festival poster billing | Headliner font sizing, VIP access badge, and live setlist |
| 🌌 **Sound DNA Aurora** | Ethereal cosmic glassmorphism & vibe matrix | Energy %, Danceability %, Underground score, and BPM meter |
| 📼 **90s Cassette Mixtape** | Skeuomorphic retro cassette shell with J-card inlay | **Spinning cassette spools** when audio previews play |
| 👾 **8-Bit Arcade Boss** | CRT phosphor scanlines & retro pixel arcade screen | High-score leaderboard with points and retro 1UP badge |
| 🧾 **Thermal Receipt 2.0** | Perforated crinkled thermal paper with barcode | Itemized minutes, genre tax calculation, and QR code |

### 🔊 Interactive Audio Engine
- **Click any track** in any card to listen to a 30-second preview snippet!
- **Generative Web Audio Synthesizer Fallback**: If a song doesn't have a 30s preview URL from Spotify (due to regional licensing), SoundWrapped automatically synthesizes an atmospheric lo-fi synth chord progression keyed to the song title so the interface is **never silent**!
- Real-time animated **mini equalizer bars** and **Now Playing dock**.

### 📸 High-Resolution Export
- **Instagram / TikTok Stories (9:16)**: 1080x1920 high-DPI export with radiant ambient glow backdrop.
- **Square Feed Post (1:1)**: 1200x1200 crisp export for Instagram feed, Twitter/X, and Discord.
- **Copy to Clipboard**: One-click instant snapshot copying.

### ⚡ Instant Demo Mode
- Test all cards, timeframes (4 Weeks, 6 Months, All Time), themes, and audio previews immediately **without needing a Spotify Client ID**.

---

## 🛠️ Architecture: How Spotify Auth Works on GitHub Pages

Traditional Spotify apps require a backend server to hide a `CLIENT_SECRET`. Because GitHub Pages only hosts static client-side files, SoundWrapped uses **Spotify PKCE OAuth (Proof Key for Code Exchange)**:

```
┌─────────────────────┐                               ┌──────────────────────┐
│  Browser (Client)   │                               │  Spotify Auth Server │
└──────────┬──────────┘                               └──────────┬───────────┘
           │                                                     │
           │  1. Generate random code_verifier                   │
           │  2. Compute SHA-256 hash (code_challenge)           │
           │  3. Redirect to Spotify Auth with code_challenge   │
           │────────────────────────────────────────────────────>│
           │                                                     │
           │  4. User logs in & grants read permissions          │
           │  5. Redirect back with ?code=XYZ                    │
           │<────────────────────────────────────────────────────│
           │                                                     │
           │  6. Exchange ?code + code_verifier for Access Token │
           │────────────────────────────────────────────────────>│
           │                                                     │
           │  7. Returns Access Token (Valid for 1 Hour)         │
           │<────────────────────────────────────────────────────│
```

- **Zero backend required** (100% serverless).
- **No Client Secret exposed** (safe to host publicly on GitHub).
- **User Privacy**: All acoustic computations and tokens stay strictly inside the visitor's local browser (`localStorage`).

---

## 🚀 Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/spotify-soundwrapped.git
   cd spotify-soundwrapped
   ```

2. **Start the local dev server**:
   ```bash
   npm start
   # or run with any static server:
   # npx serve -l 5173 .
   # python -m http.server 5173
   ```

3. Open **`http://localhost:5173`** (or `http://localhost:3000`) in your browser.

---

## 🌐 Deploying to GitHub Pages (2 Minutes)

Because this project is built with standard web technologies, hosting on GitHub Pages is virtually instant!

### Option A: Automatic Deployment (Recommended via GitHub Actions)
This repository already includes `.github/workflows/deploy.yml`:
1. Push your code to your GitHub repository:
   ```bash
   git add .
   git commit -m "Initial release of SoundWrapped"
   git push origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. Every time you push to `main`, GitHub will automatically build and publish your site to:
   ```
   https://<your-username>.github.io/<repository-name>/
   ```

### Option B: Direct Branch Deployment
1. Go to your GitHub repository **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
3. Select branch **`main`** and folder **`/(root)`**, then click **Save**.
4. Your site will be live within 60 seconds!

---

## 🔑 Connecting Real Spotify Accounts (Spotify Developer Setup)

To allow visitors or yourself to log in with real Spotify data:

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and sign in.
2. Click **Create an App**:
   - **App name**: `SoundWrapped` (or any name you like).
   - **App description**: `Experiential music wrapped cards`.
   - **Redirect URIs**: Add **all 3** of these URIs into your Spotify App settings:
     - `http://127.0.0.1:5173/` (for local IP testing)
     - `http://localhost:5173/` (for localhost testing)
     - `https://dharmawanmul.github.io/soulseekr/` (for live GitHub Pages!)
   - Under **Which API/SDKs are you planning to use?**, check **Web API**.
3. Save the app and copy your **Client ID**.
4. Open your SoundWrapped site, click **Connect Spotify**, paste your **Client ID**, and click **Authorize**!

> **Why did 127.0.0.1 work while localhost needed adding?** Spotify's security treats `localhost` and `127.0.0.1` as two completely separate domains. Registering all 3 URIs above guarantees you can log in from any URL without `INVALID_REDIRECT_URI` errors!
>
> **Don't want to configure Spotify Developer keys?** Click **Custom Top 5** in the header! You can pick presets or type any 5 songs you want — real album art and real 30-second studio audio will load automatically!

---

## 📁 Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Actions deployment
├── css/
│   ├── style.css             # Design system, layout tokens, glowing orbs, UI controls
│   └── cards.css             # 5 experiential card archetypes (Festival, DNA, Cassette, Arcade, Receipt)
├── js/
│   ├── app.js                # Main application orchestrator & event listeners
│   ├── audio-player.js       # Preview playback & Web Audio synth engine
│   ├── card-renderer.js      # Card HTML templates & formatters
│   ├── exporter.js           # html2canvas Instagram Story (9:16) & Square (1:1) PNG engine
│   ├── mock-data.js          # Realistic demo dataset for instant zero-config testing
│   └── spotify-api.js        # Spotify PKCE OAuth 2.0 client-side authentication
├── index.html                # Semantic HTML5 entrypoint
├── package.json              # Local development scripts
└── README.md                 # Complete documentation
```

---

## 🎨 Design Philosophy

- **Zero Generic Templates**: Every card uses distinct typography pairings (`Outfit`, `Space Grotesk`, `Press Start 2P`, `Space Mono`, `Courier Prime`).
- **Physical Feedback & Micro-interactions**: Tactile button scaling (`:active { transform: scale(0.97); }`), custom cubic-bezier transitions, and spinning tape spools.
- **Fail-proof & Robust**: Synthesizer fallback when preview audio is restricted; graceful fallbacks for missing artwork.

Enjoy your listening experience! 🚀
