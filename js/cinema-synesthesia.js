/**
 * Soulseekr — Cinema & Synesthesia Engine
 * 1. The Director's Cut (Criterion Collection Poster + Film Universe Match)
 * 2. The Synesthesia Canvas (Listening Barcode + Dynamic Aura Rings)
 */

import { escapeHtml } from './card-renderer.js';

export const DIRECTORS = [
  {
    id: 'wong-kar-wai',
    name: 'Wong Kar-wai',
    filmTitle: 'FALLEN IN THE REVERIE',
    spineNo: '1084',
    aspectRatio: '1.85:1 THEATRICAL // MONO',
    cinematographer: 'Christopher Doyle, HKSC',
    tagline: 'A stepped-frame reverie of unspoken longing, rain-slicked neon, and 2 AM solitude.',
    filmStill: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80', // neon alleyway
    colors: ['#059669', '#f59e0b', '#dc2626', '#0f172a'],
    traits: {
      vibe: 'Neon-Lit Melancholy',
      lighting: 'Sodium Vapor & Wet Asphalt',
      pacing: 'Step-Printed Slow Motion (12fps)',
      location: 'Chungking Mansions, Hong Kong'
    },
    matchFn: (stats) => (stats.obscurityScore > 40 ? 30 : 10) + (stats.energyScore < 65 ? 35 : 10) + (stats.nocturnalPct > 40 ? 35 : 15)
  },
  {
    id: 'denis-villeneuve',
    name: 'Denis Villeneuve',
    filmTitle: 'MONOLITHIC CHRONICLE',
    spineNo: '1142',
    aspectRatio: '2.39:1 IMAX CINEMASCOPE // DOLBY ATMOS',
    cinematographer: 'Roger Deakins, ASC BSC',
    tagline: 'Brutalist architecture, subterranean bass swells, and solitary figures facing infinite horizons.',
    filmStill: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80', // desert sci-fi
    colors: ['#d97706', '#475569', '#0891b2', '#09090b'],
    traits: {
      vibe: 'Brutalist Grandeur & Sub-Bass',
      lighting: 'Atmospheric Dust & Amber Silhouette',
      pacing: 'Hypnotic Tension & Monolithic Scale',
      location: 'Arrakis Outer Rim // Sector 4'
    },
    matchFn: (stats) => (stats.energyScore > 70 ? 35 : 10) + (stats.tempoBpm > 120 ? 30 : 15) + (stats.obscurityScore > 60 ? 35 : 10)
  },
  {
    id: 'wes-anderson',
    name: 'Wes Anderson',
    filmTitle: 'THE VINTAGE CHRONOMETER',
    spineNo: '0978',
    aspectRatio: '1.37:1 ACADEMY RATIO // VINTAGE STEREO',
    cinematographer: 'Robert Yeoman, ASC',
    tagline: 'Obsessive pastel symmetry, thrift-store luggage, and melancholic baroque-pop eccentricities.',
    filmStill: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', // pastel architecture
    colors: ['#f472b6', '#fbbf24', '#34d399', '#38bdf8'],
    traits: {
      vibe: 'Quirky Symmetrical Nostalgia',
      lighting: 'Flat Golden Hour & Kodak 35mm',
      pacing: 'Whip-Pans & Tableaux Vivants',
      location: 'Hotel Chevalier, Room 212'
    },
    matchFn: (stats) => (stats.vintageDrift > 8 ? 40 : 15) + (stats.danceScore > 60 ? 30 : 10) + (stats.obscurityScore > 50 ? 30 : 15)
  },
  {
    id: 'quentin-tarantino',
    name: 'Quentin Tarantino',
    filmTitle: 'SUNSET STRIP HIGH-VOLTAGE',
    spineNo: '0845',
    aspectRatio: '2.39:1 PANAVISION 70MM // ANALOG MASTER',
    cinematographer: 'Robert Richardson, ASC',
    tagline: 'Dusty cassette jukebox needle-drops, 1970s yellow title cards, and explosive sonic energy.',
    filmStill: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', // 70s car sunset
    colors: ['#eab308', '#dc2626', '#ea580c', '#18181b'],
    traits: {
      vibe: 'Needle-Drop 70s Catharsis',
      lighting: 'Harsh California Sodium Flare',
      pacing: 'Rapid-Fire Dialogue & Sudden Crescendo',
      location: 'Spahn Movie Ranch, 1969'
    },
    matchFn: (stats) => (stats.energyScore > 75 ? 40 : 10) + (stats.danceScore > 70 ? 30 : 15) + (stats.tempoBpm > 125 ? 30 : 15)
  },
  {
    id: 'sofia-coppola',
    name: 'Sofia Coppola',
    filmTitle: 'TRANSLATION IN THE ETHER',
    spineNo: '1022',
    aspectRatio: '1.85:1 35MM // AMBIENT STEREO',
    cinematographer: 'Lance Acord, ASC',
    tagline: 'Tokyo hotel room reverie, blurred streetlights, whispered shoegaze, and tender isolation.',
    filmStill: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80', // tokyo city lights
    colors: ['#c084fc', '#38bdf8', '#f43f5e', '#1e1b4b'],
    traits: {
      vibe: 'Dream-Pop Hotel Solitude',
      lighting: 'Diffused Morning Fog & Neon Reflection',
      pacing: 'Lingering Gazes & Quiet Transitions',
      location: 'Park Hyatt Shinjuku, 52nd Floor'
    },
    matchFn: (stats) => (stats.danceScore < 60 ? 35 : 10) + (stats.energyScore < 60 ? 35 : 15) + (stats.obscurityScore > 50 ? 30 : 15)
  },
  {
    id: 'david-lynch',
    name: 'David Lynch',
    filmTitle: 'THE MIDNIGHT LODGE',
    spineNo: '0654',
    aspectRatio: '1.85:1 DEEP MONO // THX SURROUND',
    cinematographer: 'Peter Deming, ASC',
    tagline: 'Red velvet drapes, chevron floors, distorted vinyl hums, and an eerie highway stretching into darkness.',
    filmStill: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80', // red velvet light
    colors: ['#991b1b', '#6b21a8', '#f59e0b', '#000000'],
    traits: {
      vibe: 'Surrealist Nightmare & Vinyl Static',
      lighting: 'Deep Red Spotlight & Deep Charcoal Void',
      pacing: 'Ominous Slow Crawl & Sudden Distortion',
      location: 'The Red Room // Club Silencio'
    },
    matchFn: (stats) => (stats.obscurityScore > 75 ? 40 : 10) + (stats.nocturnalPct > 50 ? 35 : 15) + (stats.tempoBpm < 115 ? 25 : 10)
  }
];

/**
 * Match user listening stats to their Cinematic Director Persona
 */
export function matchDirector(stats = {}) {
  const normalizedStats = {
    energyScore: stats.energyScore || 65,
    danceScore: stats.danceScore || 60,
    obscurityScore: stats.obscurityScore || 50,
    tempoBpm: stats.tempoBpm || 120,
    vintageDrift: stats.vintageDrift || 5,
    nocturnalPct: stats.nocturnalPct || 35
  };

  let bestMatch = DIRECTORS[0];
  let highestScore = -1;

  for (const d of DIRECTORS) {
    const score = d.matchFn(normalizedStats);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = d;
    }
  }

  return bestMatch;
}

/**
 * Extract dominant RGB/Hex colors from an image URL using in-browser Canvas
 */
export async function extractDominantColorFromImage(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve('#38bdf8');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Timeout fallback if image fails CORS or takes too long
    const timer = setTimeout(() => {
      resolve(getFallbackColor(imageUrl));
    }, 900);

    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          // Avoid pitch black or pure white extremes
          const cr = data[i], cg = data[i + 1], cb = data[i + 2];
          const brightness = (cr * 299 + cg * 587 + cb * 114) / 1000;
          if (brightness > 25 && brightness < 235) {
            r += cr;
            g += cg;
            b += cb;
            count++;
          }
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          resolve(hex);
        } else {
          resolve(getFallbackColor(imageUrl));
        }
      } catch (_) {
        resolve(getFallbackColor(imageUrl));
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(getFallbackColor(imageUrl));
    };

    img.src = imageUrl;
  });
}

function getFallbackColor(str = '') {
  const hues = ['#38bdf8', '#818cf8', '#c084fc', '#f43f5e', '#fb923c', '#34d399', '#facc15', '#a78bfa'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hues[Math.abs(hash) % hues.length];
}

/**
 * Render The Criterion Collection Movie Poster Component
 */
export function renderCriterionPosterHtml(director, user = {}, topTracks = []) {
  const userName = user.display_name || user.id || 'Audiophile';
  const leadTrack = topTracks[0] || { name: 'NO TRACK AVAILABLE', artists: [] };
  const leadArtist = (leadTrack.artists && leadTrack.artists[0]?.name) || 'Lead Soloist';
  const supportingArtists = topTracks.slice(1, 5).map(t => (t.artists && t.artists[0]?.name) || t.name).filter(Boolean);

  return `
    <div class="criterion-container">
      <!-- The Official Criterion Frame -->
      <div class="criterion-poster-card" id="criterion-export-frame">
        <!-- Film Still with Vignette -->
        <div class="criterion-art-wrapper">
          <img src="${director.filmStill}" class="criterion-still-img" alt="Film Still" />
          <div class="criterion-grain-overlay"></div>
          <div class="criterion-vignette-overlay"></div>
        </div>

        <!-- The Iconic Criterion 'C' Badge -->
        <div class="criterion-badge-c">
          <div class="criterion-c-circle">C</div>
          <div class="criterion-spine-tag">
            <span>THE CRITERION COLLECTION</span>
            <span class="criterion-spine-no">#${director.spineNo}</span>
          </div>
        </div>

        <!-- Film Title & Typography Overlay -->
        <div class="criterion-film-info">
          <div class="criterion-present-tag">A ${director.name.toUpperCase()} FILM PRESENTATION</div>
          <h1 class="criterion-film-title">${escapeHtml(leadTrack.name.toUpperCase())}</h1>
          <p class="criterion-tagline">“${director.tagline}”</p>
        </div>

        <!-- Lower Third Technical Dossier -->
        <div class="criterion-metadata-bar">
          <div class="crit-meta-cell">
            <span class="crit-meta-lbl">DIRECTOR</span>
            <span class="crit-meta-val">${director.name}</span>
          </div>
          <div class="crit-meta-cell">
            <span class="crit-meta-lbl">CINEMATOGRAPHY</span>
            <span class="crit-meta-val">${director.cinematographer}</span>
          </div>
          <div class="crit-meta-cell">
            <span class="crit-meta-lbl">ORIGINAL SCORE</span>
            <span class="crit-meta-val">${escapeHtml(userName.toUpperCase())}</span>
          </div>
          <div class="crit-meta-cell">
            <span class="crit-meta-lbl">FORMAT</span>
            <span class="crit-meta-val">${director.aspectRatio}</span>
          </div>
        </div>

        <!-- Cinematic Credits Billing Block -->
        <div class="criterion-billing-block">
          <div class="billing-line-lead">SOULSEEKR ENTERTAINMENT PRESENTS AN ARCHIVAL AUDIO PRODUCTION</div>
          <div class="billing-cast-row">
            <span>STARRING</span> <b>${escapeHtml(leadArtist.toUpperCase())}</b>
            ${supportingArtists.map(a => `<span>FEATURING</span> <b>${escapeHtml(a.toUpperCase())}</b>`).join(' ')}
          </div>
          <div class="billing-credits-grid">
            <span>PRODUCTION DESIGN: <b>SOULSEEKR LABS</b></span>
            <span>EDITED BY: <b>PKCE SESSION RUNTIME</b></span>
            <span>ATMOSPHERIC AURA: <b>${director.traits.vibe.toUpperCase()}</b></span>
            <span>RECORDED ON LOCATION: <b>${director.traits.location.toUpperCase()}</b></span>
          </div>
          <div class="billing-symbols-row">
            <span class="billing-cert">APPROVED // AUDIOPHILE ARCHIVE</span>
            <span class="billing-dot">•</span>
            <span>DOLBY DIGITAL EX</span>
            <span class="billing-dot">•</span>
            <span>COLOR BY KODAK</span>
            <span class="billing-dot">•</span>
            <span>PRINTED ON CANSON RAG</span>
          </div>
        </div>
      </div>

      <!-- Action Panel: Download Poster & Audio Snippet -->
      <div class="criterion-action-panel">
        <button class="dossier-btn-export-large" id="btn-export-criterion-poster">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Download Criterion Poster (PNG)</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Render The Synesthesia Canvas & Movie Barcode
 */
export function renderSynesthesiaHtml(tracks = [], dominantColors = []) {
  return `
    <div class="synesthesia-view-wrap">
      <!-- Top Aesthetic Introduction -->
      <div class="dossier-view-banner">
        <div class="dossier-badge-label">SYNESTHESIA CHROMATIC MATRIX</div>
        <h2 class="dossier-view-title">The Listening Barcode</h2>
        <p class="dossier-view-sub">Borrowed from the archival "Movie Barcode" format: every track from your rotation compressed into a distinct vertical color slice. A living chromatic fingerprint of your acoustic palette.</p>
      </div>

      <!-- Interactive Movie Barcode Stage -->
      <div class="dossier-card synesthesia-stage-card">
        <div class="synesthesia-controls-bar">
          <span class="synesthesia-stat-tag"><b>${tracks.length}</b> TRACKS CHROMATICALLY EXTRACTED</span>
          <div class="synesthesia-sort-buttons" id="barcode-sort-group">
            <button class="syn-sort-btn active" data-sort="chronological">Listening Order</button>
            <button class="syn-sort-btn" data-sort="spectral">Spectral Rainbow (HSL)</button>
          </div>
        </div>

        <!-- High-DPI Barcode Canvas -->
        <div class="barcode-canvas-container" id="barcode-container">
          <canvas id="synesthesia-barcode-canvas" class="barcode-canvas"></canvas>
          <div id="barcode-hover-hud" class="barcode-hud" style="display:none;"></div>
        </div>

        <div class="barcode-footer-bar">
          <span class="barcode-hint-text">← Scrub or hover across the barcode to inspect track titles & extracted hex codes</span>
          <button class="dossier-btn-export" id="btn-export-barcode-png">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Save Barcode Tapestry</span>
          </button>
        </div>
      </div>

      <!-- Aura Mesh Gradient Pulsing Core -->
      <div class="dossier-card synesthesia-aura-card">
        <div class="dossier-card-header">
          <span class="dossier-card-title">DYNAMIC AURA MESH RINGS</span>
          <span class="dossier-card-sub">VISIONOS CHROMATIC REFRACTION</span>
        </div>

        <div class="aura-mesh-showcase">
          <div class="aura-ring-orb-stage">
            <div class="aura-ring-orb ring-1" style="background: radial-gradient(circle, ${dominantColors[0] || '#38bdf8'} 0%, transparent 70%);"></div>
            <div class="aura-ring-orb ring-2" style="background: radial-gradient(circle, ${dominantColors[1] || '#c084fc'} 0%, transparent 70%);"></div>
            <div class="aura-ring-orb ring-3" style="background: radial-gradient(circle, ${dominantColors[2] || '#f59e0b'} 0%, transparent 70%);"></div>
            <div class="aura-glass-disc">
              <span class="aura-disc-brand">SOULSEEKR</span>
              <span class="aura-disc-sub">SYNESTHESIA HARMONICS</span>
            </div>
          </div>

          <div class="aura-palette-extract">
            <span class="aura-palette-title">DOMINANT EXTRACTED HEX KEYS</span>
            <div class="aura-swatches-row">
              ${dominantColors.map(hex => `
                <div class="aura-swatch-item" title="Click to copy ${hex}">
                  <div class="aura-swatch-circle" style="background:${hex};"></div>
                  <span class="aura-swatch-code">${hex.toUpperCase()}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Controller to mount & render The Listening Barcode Canvas
 */
export class SynesthesiaBarcodeController {
  constructor(canvasEl, tracks = []) {
    this.canvas = canvasEl;
    this.tracks = tracks;
    this.ctx = canvasEl?.getContext('2d');
    this.trackColors = [];
    this.sortMode = 'chronological';
    this.hoverIndex = -1;
    this.hudEl = document.getElementById('barcode-hover-hud');
    this.init();
  }

  async init() {
    if (!this.canvas) return;

    // Pre-extract or assign colors for all tracks
    this.trackColors = await Promise.all(
      this.tracks.map(async (t, i) => {
        const imgUrl = t.album?.images?.[0]?.url;
        const hex = await extractDominantColorFromImage(imgUrl);
        const hsl = hexToHsl(hex);
        return {
          track: t,
          originalIndex: i,
          hex,
          h: hsl[0],
          s: hsl[1],
          l: hsl[2]
        };
      })
    );

    this.setupListeners();
    this.render();
  }

  setupListeners() {
    window.addEventListener('resize', () => this.render());

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const count = this.getSortedTracks().length;
      if (count === 0) return;

      const stripeWidth = rect.width / count;
      const index = Math.floor(x / stripeWidth);
      if (index >= 0 && index < count) {
        this.hoverIndex = index;
        this.updateHud(e.clientX, e.clientY);
        this.render();
      }
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverIndex = -1;
      if (this.hudEl) this.hudEl.style.display = 'none';
      this.render();
    });
  }

  setSortMode(mode) {
    this.sortMode = mode;
    this.render();
  }

  getSortedTracks() {
    if (this.sortMode === 'spectral') {
      return [...this.trackColors].sort((a, b) => a.h - b.h || a.s - b.s);
    }
    return this.trackColors;
  }

  updateHud(clientX, clientY) {
    if (!this.hudEl) return;
    const sorted = this.getSortedTracks();
    const item = sorted[this.hoverIndex];
    if (!item) {
      this.hudEl.style.display = 'none';
      return;
    }

    const t = item.track;
    const artist = (t.artists && t.artists[0]?.name) || 'Unknown Artist';
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const xPos = Math.min(rect.width - 200, Math.max(10, clientX - rect.left - 90));

    this.hudEl.style.display = 'flex';
    this.hudEl.style.left = `${xPos}px`;
    this.hudEl.style.top = `-75px`;

    this.hudEl.innerHTML = `
      <div class="hud-swatch-box" style="background:${item.hex};"></div>
      <div class="hud-track-meta">
        <span class="hud-title">${escapeHtml(t.name)}</span>
        <span class="hud-artist">${escapeHtml(artist)}</span>
        <span class="hud-hex">${item.hex.toUpperCase()} • HSL(${item.h}°, ${item.s}%, ${item.l}%)</span>
      </div>
    `;
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);

    const sorted = this.getSortedTracks();
    const count = sorted.length;
    if (count === 0) return;

    const stripeWidth = w / count;

    for (let i = 0; i < count; i++) {
      const item = sorted[i];
      const isHovered = i === this.hoverIndex;

      this.ctx.fillStyle = item.hex;
      this.ctx.fillRect(i * stripeWidth, 0, stripeWidth + 0.5, h);

      if (isHovered) {
        // Highlighting bar
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(i * stripeWidth, 0, stripeWidth, 4);
        this.ctx.fillRect(i * stripeWidth, h - 4, stripeWidth, 4);
      }
    }

    // Subtle film scanline overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < h; y += 4) {
      this.ctx.fillRect(0, y, w, 1);
    }
  }
}

function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
