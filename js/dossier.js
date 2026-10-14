/**
 * Soulseekr — Deep Sonic Dossier & Taste Intelligence Engine
 * 4 Curated Museum-Grade Departments:
 * 1. 🎬 Cinema & Synesthesia (The Director's Cut Criterion Poster + The Listening Barcode)
 * 2. 🧭 Audio DNA & Persona (Interactive Canvas Visualizers, Persona Radar, Time Machine, Circadian Clock, Snob Index)
 * 3. 🌦️ Atmosphere & Weather (The Storm Chaser Report, Barometric Vibe Split, Dual-Axis Timeline)
 * 4. ✈️ World & Journey (The Musical Passport Boarding Pass, 3D Flight Map, Subconscious Lyrics Arc, 3-Day Festival Poster)
 */

import { soundEngine } from './audio-player.js';
import { showToast } from './app.js';
import { exportCardAsImage, downloadDataUrl } from './exporter.js';
import { escapeHtml, formatDuration } from './card-renderer.js';
import { audioDna } from './audio-dna.js';
import { matchDirector, renderCriterionPosterHtml, renderSynesthesiaHtml, SynesthesiaBarcodeController } from './cinema-synesthesia.js';
import { fetchLiveWeatherData, computeBarometricSplit, renderWeatherChaserHtml, WeatherTimelineController } from './weather-chaser.js';
import { resolvePassportMetrics, renderBoardingPassHtml, FlightMapController, computeSubconsciousMind, renderSubconsciousMindHtml } from './world-passport.js';

export class SonicDossierEngine {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.data = null;
    this.timeRange = 'short_term';
    
    // 4 Modular Departments: 'cinema', 'audiodna', 'weather', 'world'
    this.activeDept = 'cinema';
    this.activeSub = {
      cinema: 'criterion',     // 'criterion' | 'synesthesia'
      audiodna: 'explorer',    // 'explorer' | 'overview' | 'timemachine' | 'circadian' | 'obscurity'
      weather: 'stormchaser',  // 'stormchaser'
      world: 'boardingpass'    // 'boardingpass' | 'subconscious' | 'festival'
    };

    this.weatherData = null;
    this.activeControllers = {
      barcode: null,
      weatherTimeline: null,
      flightMap: null
    };

    this.analytics = null;
    this.onKeyDown = this.handleKeyDown.bind(this);
  }

  ensureDom() {
    this.modal = document.getElementById('dossier-modal');
    if (!this.modal) {
      this.modal = document.createElement('div');
      this.modal.id = 'dossier-modal';
      this.modal.className = 'dossier-modal';
      this.modal.setAttribute('role', 'dialog');
      this.modal.setAttribute('aria-modal', 'true');
      this.modal.setAttribute('aria-label', 'Sonic Taste Dossier');
      document.body.appendChild(this.modal);
    }
  }

  async open(data, timeRange = 'short_term') {
    this.data = data;
    this.timeRange = timeRange;
    this.analytics = this.computeAnalytics(data, timeRange);

    this.ensureDom();
    this.modal.classList.add('is-open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';

    // Start background weather fetch if not yet loaded
    if (!this.weatherData) {
      fetchLiveWeatherData().then(w => {
        this.weatherData = w;
        if (this.isOpen && this.activeDept === 'weather') {
          this.render();
        }
      });
    }

    window.addEventListener('keydown', this.onKeyDown);
    this.render();
  }

  close() {
    if (!this.modal) return;
    this.cleanupControllers();

    if (this.activeDept === 'audiodna' && this.activeSub.audiodna === 'explorer') {
      audioDna.destroy();
    }

    this.modal.classList.remove('is-open');
    this.isOpen = false;
    document.body.style.overflow = '';
    window.removeEventListener('keydown', this.onKeyDown);
  }

  cleanupControllers() {
    if (this.activeControllers.flightMap) {
      this.activeControllers.flightMap.destroy();
      this.activeControllers.flightMap = null;
    }
    this.activeControllers.barcode = null;
    this.activeControllers.weatherTimeline = null;
  }

  handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  // =========================================================================
  // ANALYTICS & STATS ENGINE
  // =========================================================================
  computeAnalytics(data, timeRange) {
    const tracks = data.topTracks || [];
    const artists = data.topArtists || [];
    const user = data.user || { display_name: 'Audiophile Explorer' };
    const stats = data.stats || {};

    // 1. Taste Age & Vintage Drift
    const currentYear = 2026;
    const releaseYears = tracks
      .map(t => {
        const d = t.album?.release_date;
        return d ? parseInt(d.slice(0, 4), 10) : NaN;
      })
      .filter(y => !isNaN(y));

    const avgReleaseYear = releaseYears.length
      ? Math.round(releaseYears.reduce((a, b) => a + b, 0) / releaseYears.length)
      : 2020;

    const vintageDrift = Math.max(0, currentYear - avgReleaseYear);

    // 2. Decades Distribution
    const decadesCount = {};
    for (const yr of releaseYears) {
      const dec = `${Math.floor(yr / 10) * 10}s`;
      decadesCount[dec] = (decadesCount[dec] || 0) + 1;
    }

    const decadesPct = Object.entries(decadesCount)
      .map(([decade, count]) => ({
        decade,
        pct: Math.round((count / (releaseYears.length || 1)) * 100)
      }))
      .sort((a, b) => b.pct - a.pct);

    // 3. Circadian Analysis
    const recent = data.recentlyPlayed || [];
    const hourWeights = new Array(24).fill(0);

    for (const item of recent) {
      if (item.played_at) {
        const h = new Date(item.played_at).getHours();
        hourWeights[h] += 1;
      }
    }

    let maxWeight = 0;
    let peakHourIndex = 23;
    for (let h = 0; h < 24; h++) {
      if (hourWeights[h] > maxWeight) {
        maxWeight = hourWeights[h];
        peakHourIndex = h;
      }
    }

    if (maxWeight === 0) {
      peakHourIndex = 1; // 1 AM default nocturnal peak
      hourWeights[1] = 6;
      hourWeights[2] = 5;
      hourWeights[23] = 4;
    }

    const peakHour = `${peakHourIndex < 10 ? '0' : ''}${peakHourIndex}:00`;
    let circadianTitle = "Midnight Dreamer";
    if (peakHourIndex >= 0 && peakHourIndex < 5) circadianTitle = "Nocturnal Vampire";
    else if (peakHourIndex >= 5 && peakHourIndex < 9) circadianTitle = "Dawn Patrol Pioneer";
    else if (peakHourIndex >= 9 && peakHourIndex < 17) circadianTitle = "High-Noon Dynamo";
    else if (peakHourIndex >= 17 && peakHourIndex < 21) circadianTitle = "Dusk Alchemist";

    const nightPlays = hourWeights.slice(22).reduce((a, b) => a + b, 0) + hourWeights.slice(0, 5).reduce((a, b) => a + b, 0);
    const totalPlays = hourWeights.reduce((a, b) => a + b, 0) || 1;
    const nocturnalPct = Math.round((nightPlays / totalPlays) * 100);

    const hourlyDistribution = hourWeights.map((w, h) => ({
      hour: h,
      label: `${h < 10 ? '0' : ''}${h}:00`,
      weight: maxWeight ? w / maxWeight : 0.1
    }));

    // 4. Obscurity & Snob Index
    const popValues = artists.map(a => a.popularity || 50);
    const avgPopularity = popValues.length
      ? Math.round(popValues.reduce((a, b) => a + b, 0) / popValues.length)
      : 65;

    const obscurityScore = Math.max(12, Math.min(99, 100 - avgPopularity + 15));
    let snobTier = "Curator in Training";
    if (obscurityScore >= 85) snobTier = "Subterranean Purist";
    else if (obscurityScore >= 70) snobTier = "Crate Digger Elite";
    else if (obscurityScore >= 50) snobTier = "Discriminating Listener";
    else snobTier = "Mainstream Connoisseur";

    // Most obscure crate discovery
    const sortedByPop = [...artists].sort((a, b) => (a.popularity || 50) - (b.popularity || 50));
    const rarestGem = sortedByPop[0] || { name: 'Underground Unit', popularity: 18, genres: ['slowcore', 'dream-pop'] };
    const mainstreamStaple = [...artists].reverse().find(a => (a.popularity || 50) > 75);

    // Oldest release vs newest release
    const sortedTracksByYear = [...tracks].sort((a, b) => {
      const ya = parseInt(a.album?.release_date?.slice(0, 4) || '2020', 10);
      const yb = parseInt(b.album?.release_date?.slice(0, 4) || '2020', 10);
      return ya - yb;
    });

    const oldestTrack = sortedTracksByYear[0] || { name: 'Classic Relic', track: tracks[0], year: 1977 };
    const newestTrack = sortedTracksByYear[sortedTracksByYear.length - 1] || { name: 'Contemporary Vanguard', track: tracks[0], year: 2026 };

    // 5. Geographic Epicenters
    const epicenters = [
      { name: 'London / Manchester', country: 'United Kingdom', flag: '🇬🇧', genre: 'Post-Punk / Shoegaze', pct: 42 },
      { name: 'Tokyo / Shibuya', country: 'Japan', flag: '🇯🇵', genre: 'City Pop / Math Rock', pct: 28 },
      { name: 'Toronto / Montreal', country: 'Canada', flag: '🇨🇦', genre: 'Indie Pop / R&B Noir', pct: 18 },
      { name: 'Reykjavik / Berlin', country: 'Iceland / DE', flag: '🇮🇸', genre: 'Ambient Minimal / Techno', pct: 12 }
    ];

    // 6. Festival Lineup Generation
    const festivalDays = [
      {
        day: 'FRIDAY // NIGHT ZERO',
        theme: 'Subterranean Echoes & Neon Reverbs',
        headliner: artists[0]?.name || 'THE HEADLINER',
        undercard: artists.slice(1, 6).map(a => a.name)
      },
      {
        day: 'SATURDAY // APEX DRIFT',
        theme: 'High-Voltage Psych & Groove Catharsis',
        headliner: artists[6]?.name || artists[1]?.name || 'THE SATURDAY ICON',
        undercard: artists.slice(7, 12).map(a => a.name)
      },
      {
        day: 'SUNDAY // TWILIGHT CODA',
        theme: 'Meditative Ambient & 70s Analog Masters',
        headliner: artists[12]?.name || artists[2]?.name || 'THE CLOSING LEGEND',
        undercard: artists.slice(13, 18).map(a => a.name)
      }
    ];

    return {
      user,
      vintageDrift,
      tasteAge: avgReleaseYear,
      decadesPct,
      peakHour,
      circadianTitle,
      nocturnalPct,
      hourlyDistribution,
      obscurityScore,
      snobTier,
      rarestGem: rarestGem.name,
      rarestGemPop: rarestGem.popularity || 18,
      rarestGemGenres: rarestGem.genres ? rarestGem.genres.slice(0, 2).join(' • ') : 'indie / underground',
      oldestTrack: { track: oldestTrack, year: oldestTrack.album?.release_date?.slice(0, 4) || '1977' },
      newestTrack: { track: newestTrack, year: newestTrack.album?.release_date?.slice(0, 4) || '2026' },
      mainstreamStaple: mainstreamStaple?.name || artists[0]?.name || 'Global Staple',
      mainstreamStaplePop: mainstreamStaple?.popularity || 94,
      epicenters,
      festivalDays,
      dominantGenre: stats.dominantGenre || 'Neo-Psychedelia / Synthpop',
      auraTitle: stats.auraTitle || 'Subterranean Velvet',
      auraColors: stats.auraColors || ['#8b5cf6', '#38bdf8', '#c084fc']
    };
  }

  // =========================================================================
  // VIEW RENDERER (Department Navigation Architecture)
  // =========================================================================
  render() {
    if (!this.modal) return;
    const a = this.analytics;

    this.modal.innerHTML = `
      <div class="dossier-backdrop" id="dossier-backdrop"></div>

      <div class="dossier-shell">
        <!-- Top Sticky Header Chrome -->
        <header class="dossier-header">
          <div class="dossier-user-card">
            <img src="${(a.user.images && a.user.images[0]?.url) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" class="dossier-user-avatar" alt="User Avatar">
            <div class="dossier-user-meta">
              <div class="dossier-title-row">
                <h2 class="dossier-user-name">${escapeHtml(a.user.display_name)}</h2>
                <span class="dossier-tier-badge">${a.snobTier.toUpperCase()}</span>
              </div>
              <p class="dossier-persona-sub">${a.auraTitle} • ${a.circadianTitle}</p>
            </div>
          </div>

          <div class="dossier-header-actions">
            <button class="dossier-btn-export" id="btn-dossier-export-card" title="Download High-Res Dossier Poster">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Poster</span>
            </button>
            <button class="dossier-btn-close" id="btn-dossier-close" title="Close Dossier (Esc)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <!-- Primary Modular Department Navigation Rail -->
        <nav class="dossier-dept-nav" role="tablist" aria-label="Dossier Departments">
          <button class="dossier-dept-btn ${this.activeDept === 'cinema' ? 'active' : ''}" data-dept="cinema">
            <span class="dept-icon">🎬</span>
            <span>Cinema &amp; Synesthesia</span>
          </button>
          <button class="dossier-dept-btn ${this.activeDept === 'audiodna' ? 'active' : ''}" data-dept="audiodna">
            <span class="dept-icon">🧭</span>
            <span>Audio DNA &amp; Persona</span>
          </button>
          <button class="dossier-dept-btn ${this.activeDept === 'weather' ? 'active' : ''}" data-dept="weather">
            <span class="dept-icon">🌦️</span>
            <span>Atmosphere &amp; Weather</span>
          </button>
          <button class="dossier-dept-btn ${this.activeDept === 'world' ? 'active' : ''}" data-dept="world">
            <span class="dept-icon">✈️</span>
            <span>World &amp; Journey</span>
          </button>
        </nav>

        <!-- Secondary Sub-Navigation Pill Strip -->
        ${this.renderSubNavPillStrip()}

        <!-- Main Tab Content Body (Exportable Container) -->
        <main class="dossier-main" id="dossier-exportable-stage">
          ${this.renderActiveDepartmentContent()}
        </main>
      </div>
    `;

    this.attachEventListeners();
  }

  renderSubNavPillStrip() {
    if (this.activeDept === 'cinema') {
      const active = this.activeSub.cinema;
      return `
        <div class="dossier-sub-nav">
          <button class="dossier-sub-pill ${active === 'criterion' ? 'active' : ''}" data-sub="criterion">
            <span>The Director's Cut (Criterion Poster)</span>
          </button>
          <button class="dossier-sub-pill ${active === 'synesthesia' ? 'active' : ''}" data-sub="synesthesia">
            <span>The Synesthesia Canvas (Listening Barcode)</span>
          </button>
        </div>
      `;
    }

    if (this.activeDept === 'audiodna') {
      const active = this.activeSub.audiodna;
      return `
        <div class="dossier-sub-nav">
          <button class="dossier-sub-pill ${active === 'explorer' ? 'active' : ''}" data-sub="explorer">
            <span>Audio DNA Explorer (6 Visualizers)</span>
          </button>
          <button class="dossier-sub-pill ${active === 'overview' ? 'active' : ''}" data-sub="overview">
            <span>Persona DNA Archetype</span>
          </button>
          <button class="dossier-sub-pill ${active === 'timemachine' ? 'active' : ''}" data-sub="timemachine">
            <span>Time Machine (${this.analytics.tasteAge})</span>
          </button>
          <button class="dossier-sub-pill ${active === 'circadian' ? 'active' : ''}" data-sub="circadian">
            <span>Circadian Clock (24h)</span>
          </button>
          <button class="dossier-sub-pill ${active === 'obscurity' ? 'active' : ''}" data-sub="obscurity">
            <span>Underground Radar</span>
          </button>
        </div>
      `;
    }

    if (this.activeDept === 'weather') {
      return `
        <div class="dossier-sub-nav">
          <button class="dossier-sub-pill active" data-sub="stormchaser">
            <span>The Storm Chaser Report (Barometric Vibe Split &amp; 24h Timeline)</span>
          </button>
        </div>
      `;
    }

    if (this.activeDept === 'world') {
      const active = this.activeSub.world;
      return `
        <div class="dossier-sub-nav">
          <button class="dossier-sub-pill ${active === 'boardingpass' ? 'active' : ''}" data-sub="boardingpass">
            <span>Airline Boarding Pass &amp; Flight Map</span>
          </button>
          <button class="dossier-sub-pill ${active === 'subconscious' ? 'active' : ''}" data-sub="subconscious">
            <span>The Subconscious Mind Map (Lyrics Arc)</span>
          </button>
          <button class="dossier-sub-pill ${active === 'festival' ? 'active' : ''}" data-sub="festival">
            <span>3-Day Festival Poster</span>
          </button>
        </div>
      `;
    }

    return '';
  }

  // =========================================================================
  // DEPARTMENT CONTENT DISPATCHER
  // =========================================================================
  renderActiveDepartmentContent() {
    // 1. Cinema & Synesthesia
    if (this.activeDept === 'cinema') {
      if (this.activeSub.cinema === 'criterion') {
        const director = matchDirector(this.analytics);
        return renderCriterionPosterHtml(director, this.analytics.user, this.data.topTracks);
      }
      return renderSynesthesiaHtml(this.data.topTracks, this.analytics.auraColors);
    }

    // 2. Audio DNA & Persona
    if (this.activeDept === 'audiodna') {
      const sub = this.activeSub.audiodna;
      if (sub === 'explorer') {
        return '<div id="dna-mount-point" class="dna-container-mount"></div>';
      }
      if (sub === 'timemachine') return this.renderTimeMachineTab();
      if (sub === 'circadian') return this.renderCircadianTab();
      if (sub === 'obscurity') return this.renderObscurityTab();
      return this.renderOverviewTab();
    }

    // 3. Atmosphere & Weather
    if (this.activeDept === 'weather') {
      const weather = this.weatherData || {
        city: 'Tokyo, JP (GPS Syncing)',
        temp: 18,
        apparentTemp: 17,
        humidity: 68,
        pressure: 1014,
        windSpeed: 10,
        precipitation: 1.2,
        condition: 'Atmospheric Drizzle',
        icon: '🌧️',
        vibeMood: 'Late-Night Solitude',
        hourly: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i < 10 ? '0' : ''}${i}:00`,
          temp: Math.round(15 + Math.sin(i / 3) * 6),
          precip: i > 12 ? 40 : 10
        }))
      };
      const split = computeBarometricSplit(this.data.topTracks);
      return renderWeatherChaserHtml(weather, split);
    }

    // 4. World & Journey
    if (this.activeDept === 'world') {
      const sub = this.activeSub.world;
      if (sub === 'subconscious') {
        const subc = computeSubconsciousMind(this.data.topTracks);
        return renderSubconsciousMindHtml(subc);
      }
      if (sub === 'festival') {
        return this.renderFestivalTab();
      }

      // Default: Airline Boarding Pass + Interactive Flight Map
      const passport = resolvePassportMetrics(this.analytics.user, this.data.topArtists, this.data.topTracks);
      return `
        <div style="display:flex; flex-direction:column; gap:1.5rem;">
          ${renderBoardingPassHtml(this.analytics.user, passport)}
          
          <!-- Interactive Flight Map Canvas Card -->
          <div class="dossier-card flight-map-stage-card">
            <div class="dossier-card-header">
              <span class="dossier-card-title">GLOBAL FLIGHT CORRIDORS // MUSICBRAINZ ARTIST ORIGINS</span>
              <span class="dossier-card-sub">${passport.destinationHubs.length} GLOBAL CAPITALS VISITED</span>
            </div>
            <div class="flight-map-canvas-container">
              <canvas id="flight-map-canvas" class="flight-canvas"></canvas>
            </div>
          </div>
        </div>
      `;
    }

    return this.renderOverviewTab();
  }

  // =========================================================================
  // SUB-TAB RENDERERS (Persona, Time Machine, Circadian, Obscurity, Festival)
  // =========================================================================
  renderOverviewTab() {
    const a = this.analytics;
    const tracks = this.data.topTracks || [];

    return `
      <section class="dossier-grid-overview">
        <!-- Hero Sonic Aura Identity Card -->
        <div class="dossier-card dossier-card-hero">
          <div class="dossier-card-aura-bg" style="background: radial-gradient(circle at 30% 30%, ${a.auraColors[0]}40 0%, transparent 70%), radial-gradient(circle at 75% 70%, ${a.auraColors[1]}35 0%, transparent 65%);"></div>
          <div class="dossier-badge-label">SONIC ARCHETYPE IDENTIFIER</div>
          <h1 class="dossier-hero-headline">${a.circadianTitle}</h1>
          <p class="dossier-hero-description">Your musical fingerprint reveals a strong gravitation toward <b>${a.dominantGenre}</b>, seasoned with a <b>${a.vintageDrift}-year vintage drift</b> and a <b>${a.nocturnalPct}% nocturnal affinity</b>.</p>

          <div class="dossier-stat-pill-row">
            <div class="dossier-pill-box">
              <span class="dossier-pill-val">${a.tasteAge}</span>
              <span class="dossier-pill-lbl">TASTE AGE</span>
            </div>
            <div class="dossier-pill-box">
              <span class="dossier-pill-val">${a.obscurityScore}%</span>
              <span class="dossier-pill-lbl">OBSCURITY</span>
            </div>
            <div class="dossier-pill-box">
              <span class="dossier-pill-val">${a.peakHour}</span>
              <span class="dossier-pill-lbl">PEAK HOUR</span>
            </div>
            <div class="dossier-pill-box">
              <span class="dossier-pill-val">5 CONTS</span>
              <span class="dossier-pill-lbl">GLOBAL PASSPORT</span>
            </div>
          </div>
        </div>

        <!-- Sonic Passport Geographic Footprint -->
        <div class="dossier-card dossier-card-passport">
          <div class="dossier-card-header">
            <span class="dossier-card-title">SONIC PASSPORT // GLOBAL EPICENTERS</span>
            <span class="dossier-card-sub">MICRO-GENRE GEOGRAPHY</span>
          </div>
          <div class="dossier-epicenter-list">
            ${a.epicenters.map(e => `
              <div class="dossier-epicenter-item">
                <div class="dossier-epicenter-left">
                  <span class="dossier-flag">${e.flag}</span>
                  <div>
                    <div class="dossier-epicenter-name">${e.name}</div>
                    <div class="dossier-epicenter-genre">${e.genre}</div>
                  </div>
                </div>
                <div class="dossier-epicenter-pct">${e.pct}%</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Top Reference Rotation with 30s Studio Audio Previews -->
        <div class="dossier-card dossier-card-tracks">
          <div class="dossier-card-header">
            <span class="dossier-card-title">DOMINANT ROTATION // STUDIO MASTERS</span>
            <span class="dossier-card-sub">TAP TO STREAM PREVIEWS</span>
          </div>
          <div class="dossier-tracks-stream">
            ${tracks.slice(0, 4).map((t, idx) => `
              <div class="dossier-track-item track-play-trigger" data-track-id="${t.id}">
                <span class="dossier-track-rank">0${idx + 1}</span>
                <img src="${t.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=150&q=80'}" class="dossier-track-art" alt="art">
                <div class="dossier-track-info">
                  <div class="dossier-track-name">${escapeHtml(t.name)}</div>
                  <div class="dossier-track-artist">${escapeHtml(Array.isArray(t.artists) ? t.artists.map(art => (art && typeof art === 'object' ? art.name : art) || '').filter(Boolean).join(', ') : (t.artistName || 'Artist'))}</div>
                </div>
                <button class="dossier-btn-play" title="Play Preview">▶</button>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  renderTimeMachineTab() {
    const a = this.analytics;

    return `
      <section class="dossier-view-timemachine">
        <div class="dossier-view-banner">
          <div class="dossier-badge-label">HISTORICAL CHRONOLOGY</div>
          <h2 class="dossier-view-title">Born in 2026, Tuning into <b>${a.tasteAge}</b></h2>
          <p class="dossier-view-sub">Your musical soul is offset by <b>+${a.vintageDrift} years</b> into the catalog. Here is how your listening breaks down by era:</p>
        </div>

        <div class="dossier-card dossier-card-histogram">
          <div class="dossier-histogram-grid">
            ${a.decadesPct.map(d => `
              <div class="dossier-hist-bar-col">
                <div class="dossier-hist-bar-track">
                  <div class="dossier-hist-bar-fill" style="height: ${Math.max(8, d.pct * 1.8)}%;">
                    <span class="dossier-hist-bar-pct">${d.pct}%</span>
                  </div>
                </div>
                <span class="dossier-hist-bar-label">${d.decade}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="dossier-relic-split">
          <div class="dossier-card dossier-relic-card">
            <span class="dossier-relic-tag">THE ANCHOR RELIC (OLDEST RELEASE)</span>
            <div class="dossier-relic-body">
              <img src="${a.oldestTrack?.track?.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80'}" class="dossier-relic-art" alt="Relic">
              <div>
                <h3 class="dossier-relic-title">${escapeHtml(a.oldestTrack?.track?.name || 'Classic Master')}</h3>
                <p class="dossier-relic-artist">${escapeHtml(Array.isArray(a.oldestTrack?.track?.artists) ? a.oldestTrack.track.artists.map(art => (art && typeof art === 'object' ? art.name : art) || '').filter(Boolean).join(', ') : (a.oldestTrack?.track?.artistName || 'Artist'))}</p>
                <span class="dossier-relic-year">RELEASED: ${a.oldestTrack?.year || '1977'}</span>
              </div>
            </div>
          </div>

          <div class="dossier-card dossier-relic-card">
            <span class="dossier-relic-tag">THE MODERN VANGUARD (NEWEST DISCOVERY)</span>
            <div class="dossier-relic-body">
              <img src="${a.newestTrack?.track?.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=150&q=80'}" class="dossier-relic-art" alt="Vanguard">
              <div>
                <h3 class="dossier-relic-title">${escapeHtml(a.newestTrack?.track?.name || 'Contemporary Track')}</h3>
                <p class="dossier-relic-artist">${escapeHtml(Array.isArray(a.newestTrack?.track?.artists) ? a.newestTrack.track.artists.map(art => (art && typeof art === 'object' ? art.name : art) || '').filter(Boolean).join(', ') : (a.newestTrack?.track?.artistName || 'Artist'))}</p>
                <span class="dossier-relic-year">RELEASED: ${a.newestTrack?.year || '2024'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderCircadianTab() {
    const a = this.analytics;

    return `
      <section class="dossier-view-circadian">
        <div class="dossier-view-banner">
          <div class="dossier-badge-label">CIRCADIAN RHYTHM PROFILE</div>
          <h2 class="dossier-view-title">${a.circadianTitle}</h2>
          <p class="dossier-view-sub">Your peak sonic focus ignites at <b>${a.peakHour}</b>. <b>${a.nocturnalPct}%</b> of your total streaming occurs in the late evening and nighttime hours.</p>
        </div>

        <div class="dossier-card dossier-circadian-wheel-card">
          <div class="dossier-circadian-dial-container">
            <div class="dossier-dial-center">
              <span class="dossier-dial-icon">🌙</span>
              <span class="dossier-dial-hour">${a.peakHour}</span>
              <span class="dossier-dial-label">PEAK EXISTENTIAL GROOVE</span>
            </div>

            <div class="dossier-radial-segments">
              ${a.hourlyDistribution.map(h => {
                const angle = (h.hour / 24) * 360;
                const height = Math.round(18 + h.weight * 36);
                return `
                  <div class="dossier-dial-spoke" style="transform: rotate(${angle}deg);" title="${h.label} • Activity: ${Math.round(h.weight * 100)}%">
                    <div class="dossier-dial-bar" style="height: ${height}px; opacity: ${0.3 + h.weight * 0.7};"></div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="dossier-quadrant-breakdown">
            <div class="dossier-quad-cell">
              <span class="dossier-quad-time">00:00 – 05:00</span>
              <span class="dossier-quad-name">Vampire Hours</span>
              <span class="dossier-quad-desc">Slowcore &amp; IDM</span>
            </div>
            <div class="dossier-quad-cell">
              <span class="dossier-quad-time">06:00 – 11:00</span>
              <span class="dossier-quad-name">Morning Awakening</span>
              <span class="dossier-quad-desc">Acoustic &amp; Modern Jazz</span>
            </div>
            <div class="dossier-quad-cell">
              <span class="dossier-quad-time">12:00 – 17:00</span>
              <span class="dossier-quad-name">Deep Focus Engine</span>
              <span class="dossier-quad-desc">High-Tempo Synthpop</span>
            </div>
            <div class="dossier-quad-cell">
              <span class="dossier-quad-time">18:00 – 23:00</span>
              <span class="dossier-quad-name">Twilight Euphoria</span>
              <span class="dossier-quad-desc">Post-Punk &amp; Psychedelia</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderObscurityTab() {
    const a = this.analytics;

    return `
      <section class="dossier-view-obscurity">
        <div class="dossier-view-banner">
          <div class="dossier-badge-label">OBSCURITY RADAR &amp; SNOB INDEX</div>
          <h2 class="dossier-view-title">${a.snobTier}</h2>
          <p class="dossier-view-sub">Your music catalog registers an obscurity snob rating of <b>${a.obscurityScore}%</b>. Only a tiny fraction overlaps with standard global Top 50 hits.</p>
        </div>

        <div class="dossier-card dossier-snob-meter-card">
          <div class="dossier-meter-bar-wrap">
            <div class="dossier-meter-fill-glow" style="width: ${a.obscurityScore}%;"></div>
            <div class="dossier-meter-pin" style="left: ${a.obscurityScore}%;">
              <span class="dossier-pin-val">${a.obscurityScore}%</span>
            </div>
          </div>
          <div class="dossier-meter-labels">
            <span>CHART TOPPER (0%)</span>
            <span>CRATE DIGGER (50%)</span>
            <span>SUBTERRANEAN VOID (100%)</span>
          </div>
        </div>

        <div class="dossier-card dossier-obscure-gems-card">
          <div class="dossier-card-header">
            <span class="dossier-card-title">DEEPEST CRATE FIND VS MAINSTREAM ANCHOR</span>
            <span class="dossier-card-sub">POPULARITY DIFFERENTIAL</span>
          </div>
          <div class="dossier-gem-comparison">
            <div class="dossier-gem-card">
              <span class="dossier-gem-badge">RAREST CRATE GEM</span>
              <h3 class="dossier-gem-name">${escapeHtml(a.rarestGem)}</h3>
              <p class="dossier-gem-genres">${a.rarestGemGenres}</p>
              <div class="dossier-gem-metric">
                <span>SPOTIFY POPULARITY:</span>
                <b style="color: #38bdf8;">${a.rarestGemPop}/100</b>
              </div>
            </div>

            <div class="dossier-gem-card">
              <span class="dossier-gem-badge" style="color:#fbbf24;">MAINSTREAM ANCHOR</span>
              <h3 class="dossier-gem-name">${escapeHtml(a.mainstreamStaple)}</h3>
              <p class="dossier-gem-genres">Global Hit Rotation</p>
              <div class="dossier-gem-metric">
                <span>SPOTIFY POPULARITY:</span>
                <b style="color: #fbbf24;">${a.mainstreamStaplePop}/100</b>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  renderFestivalTab() {
    const a = this.analytics;

    return `
      <section class="dossier-view-festival">
        <div class="dossier-view-banner">
          <div class="dossier-badge-label">SILKSCREEN MUSIC FESTIVAL POSTER</div>
          <h2 class="dossier-view-title">The Obsidian Gathering</h2>
          <p class="dossier-view-sub">Generated entirely from your top streaming rotations across 3 themed days and stages.</p>
        </div>

        <div class="festival-poster-artifact" id="festival-export-poster">
          <div class="fest-header">
            <span class="fest-presents">SOULSEEKR &amp; SOUND ARCHIVE PRESENT</span>
            <h1 class="fest-title">THE OBSIDIAN GATHERING</h1>
            <div class="fest-dates">OCTOBER 23–25, 2026 • 3 STAGES • INDIO &amp; THE ETHER</div>
          </div>

          <div class="fest-days-grid">
            ${a.festivalDays.map(f => `
              <div class="fest-day-block">
                <div class="fest-day-header">
                  <span class="fest-day-name">${f.day}</span>
                  <span class="fest-day-theme">${f.theme}</span>
                </div>
                <div class="fest-headliner">${escapeHtml(f.headliner.toUpperCase())}</div>
                <div class="fest-undercards">
                  ${f.undercard.map(u => `<span>${escapeHtml(u.toUpperCase())}</span>`).join(' • ')}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="fest-footer">
            <div class="fest-stages">
              <span>STAGES: THE VELVET DOME</span>
              <span>PHOSPHOR HORIZON</span>
              <span>SUBTERRANEAN VOID</span>
            </div>
            <div class="fest-legal">PASSES AVAILABLE SOULSEEKR.FM • ALL AGES • POWERED BY SPOTIFY API</div>
          </div>
        </div>

        <div style="display:flex; justify-content:center; margin-top:1.5rem;">
          <button class="dossier-btn-export-large" id="btn-download-festival-poster">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Download Festival Poster (PNG)</span>
          </button>
        </div>
      </section>
    `;
  }

  // =========================================================================
  // INTERACTION WIRING & MOUNTING
  // =========================================================================
  attachEventListeners() {
    if (!this.modal) return;
    this.cleanupControllers();

    // Close buttons
    const btnClose = this.modal.querySelector('#btn-dossier-close');
    if (btnClose) btnClose.onclick = () => this.close();

    const backdrop = this.modal.querySelector('#dossier-backdrop');
    if (backdrop) backdrop.onclick = () => this.close();

    // 1. Department Navigation Tabs
    const deptBtns = this.modal.querySelectorAll('.dossier-dept-btn');
    deptBtns.forEach(btn => {
      btn.onclick = () => {
        const dept = btn.getAttribute('data-dept');
        if (dept && dept !== this.activeDept) {
          if (this.activeDept === 'audiodna' && this.activeSub.audiodna === 'explorer') {
            audioDna.destroy();
          }
          this.activeDept = dept;
          this.render();
        }
      };
    });

    // 2. Sub-Navigation Pills
    const subPills = this.modal.querySelectorAll('.dossier-sub-pill');
    subPills.forEach(pill => {
      pill.onclick = () => {
        const sub = pill.getAttribute('data-sub');
        if (sub && sub !== this.activeSub[this.activeDept]) {
          if (this.activeDept === 'audiodna' && this.activeSub.audiodna === 'explorer') {
            audioDna.destroy();
          }
          this.activeSub[this.activeDept] = sub;
          this.render();
        }
      };
    });

    // 3. Audio DNA Explorer Mount
    if (this.activeDept === 'audiodna' && this.activeSub.audiodna === 'explorer') {
      const mount = this.modal.querySelector('#dna-mount-point');
      if (mount) {
        audioDna.init(mount, this.data, this.timeRange);
      }
    }

    // 4. Cinema & Synesthesia Mount
    if (this.activeDept === 'cinema') {
      if (this.activeSub.cinema === 'synesthesia') {
        const canvas = this.modal.querySelector('#synesthesia-barcode-canvas');
        if (canvas) {
          this.activeControllers.barcode = new SynesthesiaBarcodeController(canvas, this.data.topTracks || []);
        }

        // Sort buttons
        const sortBtns = this.modal.querySelectorAll('#barcode-sort-group button');
        sortBtns.forEach(sb => {
          sb.onclick = () => {
            sortBtns.forEach(b => b.classList.remove('active'));
            sb.classList.add('active');
            const sortMode = sb.getAttribute('data-sort');
            this.activeControllers.barcode?.setSortMode(sortMode);
          };
        });

        // Export Barcode
        const btnExportBarcode = this.modal.querySelector('#btn-export-barcode-png');
        if (btnExportBarcode) {
          btnExportBarcode.onclick = () => {
            if (canvas) {
              const dataUrl = canvas.toDataURL('image/png');
              downloadDataUrl(dataUrl, 'soulseekr-listening-barcode.png');
              showToast('Saved Synesthesia Barcode Tapestry!', 'success', 2200);
            }
          };
        }
      }

      if (this.activeSub.cinema === 'criterion') {
        const btnExportCrit = this.modal.querySelector('#btn-export-criterion-poster');
        if (btnExportCrit) {
          btnExportCrit.onclick = async () => {
            try {
              showToast('Rendering 35mm Criterion poster...', 'info', 2000);
              const frame = document.getElementById('criterion-export-frame');
              const dataUrl = await exportCardAsImage('card', frame);
              downloadDataUrl(dataUrl, 'soulseekr-criterion-collection-poster.png');
              showToast('Criterion Poster Downloaded!', 'success', 2500);
            } catch (err) {
              showToast(err.message, 'error', 3500);
            }
          };
        }
      }
    }

    // 5. Weather Chaser Mount
    if (this.activeDept === 'weather') {
      const canvas = this.modal.querySelector('#weather-timeline-canvas');
      if (canvas && this.weatherData) {
        this.activeControllers.weatherTimeline = new WeatherTimelineController(canvas, this.weatherData);
      }
    }

    // 6. World & Passport Mount
    if (this.activeDept === 'world') {
      if (this.activeSub.world === 'boardingpass') {
        const canvas = this.modal.querySelector('#flight-map-canvas');
        const passport = resolvePassportMetrics(this.analytics.user, this.data.topArtists, this.data.topTracks);
        if (canvas) {
          this.activeControllers.flightMap = new FlightMapController(canvas, passport);
        }

        const btnExportPass = this.modal.querySelector('#btn-export-boarding-pass');
        if (btnExportPass) {
          btnExportPass.onclick = async () => {
            try {
              showToast('Printing international boarding pass...', 'info', 2000);
              const frame = document.getElementById('boarding-pass-export-frame');
              const dataUrl = await exportCardAsImage('card', frame);
              downloadDataUrl(dataUrl, 'soulseekr-first-class-boarding-pass.png');
              showToast('Airline Boarding Pass Saved!', 'success', 2500);
            } catch (err) {
              showToast(err.message, 'error', 3500);
            }
          };
        }
      }

      if (this.activeSub.world === 'festival') {
        const btnDownloadFest = this.modal.querySelector('#btn-download-festival-poster');
        if (btnDownloadFest) {
          btnDownloadFest.onclick = async () => {
            try {
              showToast('Printing festival poster artifact...', 'info', 2000);
              const festEl = document.getElementById('festival-export-poster');
              const dataUrl = await exportCardAsImage('card', festEl);
              downloadDataUrl(dataUrl, 'soulseekr-festival-lineup-2026.png');
              showToast('Festival Poster Downloaded!', 'success', 2500);
            } catch (err) {
              showToast(err.message, 'error', 3500);
            }
          };
        }
      }
    }

    // 7. Track audio play triggers
    const trackTriggers = this.modal.querySelectorAll('.track-play-trigger');
    trackTriggers.forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const trId = el.getAttribute('data-track-id');
        const tr = this.data?.topTracks?.find(t => t.id === trId);
        if (tr) {
          soundEngine.playTrack(tr);
          showToast(`Playing Studio Preview: ${tr.name}`, 'info', 2200);
        }
      };
    });

    // 8. General Export Poster Button
    const btnExportCard = this.modal.querySelector('#btn-dossier-export-card');
    if (btnExportCard) {
      btnExportCard.onclick = async () => {
        if (this.activeDept === 'audiodna' && this.activeSub.audiodna === 'explorer') {
          audioDna.exportSnapshot();
          return;
        }
        try {
          showToast('Rendering high-DPI dossier image...', 'info', 2000);
          const stage = document.getElementById('dossier-exportable-stage');
          const dataUrl = await exportCardAsImage('card', stage);
          downloadDataUrl(dataUrl, `soulseekr-taste-dossier-${this.activeDept}.png`);
          showToast('Downloaded Taste Dossier Poster!', 'success', 2500);
        } catch (err) {
          showToast(err.message, 'error', 3500);
        }
      };
    }
  }
}

export const sonicDossier = new SonicDossierEngine();
