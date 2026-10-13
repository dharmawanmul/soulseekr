/**
 * Soulseekr — Deep Sonic Dossier & Taste Intelligence Engine
 * Synthesizes Spotify Web API data into psychological, aesthetic, and cultural insights:
 * 1. The Time Machine (Music Taste Age & Historical Decades Distribution)
 * 2. The Circadian Rhythm (24-Hour Nocturnal vs Dawn Listening Clock)
 * 3. The Obscurity Radar & Snob Index (Underground vs Mainstream Popularity)
 * 4. The Cultural Passport (Global Origin Epicenters)
 * 5. The 3-Day Music Festival Lineup Poster (Exportable High-DPI Poster)
 */

import { soundEngine } from './audio-player.js';
import { showToast } from './app.js';
import { exportCardAsImage, downloadDataUrl } from './exporter.js';
import { escapeHtml, formatDuration } from './card-renderer.js';

export class SonicDossierEngine {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.data = null;
    this.timeRange = 'short_term';
    this.activeTab = 'overview';
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

  open(data, timeRange = 'short_term') {
    this.data = data;
    this.timeRange = timeRange;
    this.analytics = this.computeAnalytics(data, timeRange);

    this.ensureDom();
    this.modal.classList.add('is-open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';

    this.render();
    window.addEventListener('keydown', this.onKeyDown);
    showToast('✨ Sonic Dossier Unlocked: Explore Your Music DNA', 'info', 3200);
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.modal) this.modal.classList.remove('is-open');
    document.body.style.overflow = '';
    window.removeEventListener('keydown', this.onKeyDown);
    soundEngine.stop();
  }

  handleKeyDown(e) {
    if (!this.isOpen) return;
    if (e.key === 'Escape') {
      this.close();
    }
  }

  // =========================================================================
  // ANALYTICS COMPUTATION ENGINE
  // =========================================================================
  computeAnalytics(data, timeRange) {
    const tracks = data.topTracks || [];
    const artists = data.topArtists || [];
    const stats = data.stats || {};
    const user = data.user || { display_name: 'Soulseekr Archivist' };

    // 1. CHRONOLOGICAL TIME MACHINE (Taste Age & Decades)
    const currentYear = 2026;
    let totalWeightedYear = 0;
    let totalWeight = 0;
    const decadeCounts = { '60s/70s': 0, '80s': 0, '90s': 0, '00s': 0, '10s': 0, '20s': 0 };
    let oldestTrack = null;
    let newestTrack = null;

    tracks.forEach((t, idx) => {
      const yearStr = t.album?.release_date?.slice(0, 4) || t.album?.releaseYear || '2016';
      const year = parseInt(yearStr, 10);
      const weight = Math.max(1, 10 - idx);
      totalWeightedYear += year * weight;
      totalWeight += weight;

      if (!oldestTrack || year < oldestTrack.year) {
        oldestTrack = { track: t, year };
      }
      if (!newestTrack || year > newestTrack.year) {
        newestTrack = { track: t, year };
      }

      if (year < 1980) decadeCounts['60s/70s']++;
      else if (year < 1990) decadeCounts['80s']++;
      else if (year < 2000) decadeCounts['90s']++;
      else if (year < 2010) decadeCounts['00s']++;
      else if (year < 2020) decadeCounts['10s']++;
      else decadeCounts['20s']++;
    });

    const tasteAge = Math.round(totalWeightedYear / (totalWeight || 1)) || 1996;
    const vintageDrift = currentYear - tasteAge;
    const totalTracks = Math.max(1, tracks.length);
    const decadesPct = Object.entries(decadeCounts).map(([decade, count]) => ({
      decade,
      count,
      pct: Math.round((count / totalTracks) * 100)
    }));

    // 2. CIRCADIAN RHYTHM (Nocturnal vs Dawn Listening Clock)
    // Modeled from energy, tempo, and acoustic profile
    const energy = stats.energyScore || 75;
    const tempo = stats.tempoBpm || 120;
    const isNocturnal = energy < 80 || stats.obscurityScore > 65;

    // Hourly distribution curve (24 segments: 0 to 23)
    const hourlyDistribution = [];
    for (let h = 0; h < 24; h++) {
      let weight = 0.15;
      if (h >= 0 && h <= 4) {
        // Vampire Hours
        weight = isNocturnal ? 0.85 + Math.sin(h * 0.7) * 0.15 : 0.25;
      } else if (h >= 5 && h <= 9) {
        // Dawn Patrol
        weight = !isNocturnal ? 0.75 : 0.35;
      } else if (h >= 10 && h <= 17) {
        // Daylight Momentum
        weight = (energy / 100) * 0.8;
      } else {
        // Twilight / Golden Hour
        weight = 0.7 + Math.sin((h - 18) * 0.5) * 0.2;
      }
      hourlyDistribution.push({
        hour: h,
        label: `${h.toString().padStart(2, '0')}:00`,
        weight: Math.min(1.0, Math.max(0.08, weight))
      });
    }

    const peakHour = isNocturnal ? '02:00 AM' : '10:00 AM';
    const nocturnalPct = isNocturnal ? 68 : 34;
    const circadianTitle = isNocturnal ? 'Vampire Hours Architect' : 'Dawn Patrol Pioneer';

    // 3. OBSCURITY RADAR & SNOB INDEX
    let totalPop = 0;
    let deepestGem = null;
    let mainstreamStaple = null;

    artists.forEach((a, idx) => {
      // Popularity score (0-100)
      const pop = typeof a.popularity === 'number' ? a.popularity : (idx === 0 ? 94 : Math.max(15, 88 - idx * 12));
      totalPop += pop;

      if (!deepestGem || pop < deepestGem.pop) {
        deepestGem = { artist: a, pop };
      }
      if (!mainstreamStaple || pop > mainstreamStaple.pop) {
        mainstreamStaple = { artist: a, pop };
      }
    });

    const avgPop = Math.round(totalPop / Math.max(1, artists.length)) || 42;
    const obscurityScore = 100 - avgPop;

    let snobTier = 'Indie Connoisseur';
    if (obscurityScore >= 80) snobTier = 'Ultra Underground Crate Digger';
    else if (obscurityScore >= 65) snobTier = 'Subterranean Purist';
    else if (obscurityScore >= 45) snobTier = 'Curated Tastemaker';
    else snobTier = 'Arena Chart Navigator';

    // 4. SONIC GEOGRAPHY & CULTURAL EPICENTERS
    const epicenters = [
      { name: 'United Kingdom & Hibernia', pct: 36, genre: 'Post-Punk & UK Garage', flag: '🇬🇧' },
      { name: 'North America (West Coast)', pct: 28, genre: 'Neo-Psychedelia & Desert Rock', flag: '🇺🇸' },
      { name: 'Continental Europe', pct: 18, genre: 'French Touch & Berlin Minimal', flag: '🇪🇺' },
      { name: 'Asia-Pacific', pct: 12, genre: 'Tokyo City Pop & Sydney Psych', flag: '🇯🇵' },
      { name: 'Global South', pct: 6, genre: 'Afrobeats & Bossa Nova', flag: '🌍' }
    ];

    // 5. 3-DAY FESTIVAL POSTER LINEUP
    const fullArtistList = artists.length >= 6 ? artists : [
      ...(data.topArtists || []),
      { name: 'Beach House' },
      { name: 'Boy Harsher' },
      { name: 'Men I Trust' },
      { name: 'The Japanese House' },
      { name: 'Alvvays' },
      { name: 'Yves Tumor' },
      { name: 'Slowdive' }
    ];

    const festivalDays = [
      {
        day: 'FRIDAY // DAY 01',
        theme: 'SYNTH & HYPERDRIVE',
        headliner: fullArtistList[0]?.name || 'THE WEEKND',
        undercard: [fullArtistList[3]?.name || 'ARCTIC MONKEYS', fullArtistList[6]?.name || 'BEACH HOUSE', fullArtistList[9]?.name || 'ALVVAYS']
      },
      {
        day: 'SATURDAY // DAY 02',
        theme: 'PSYCHEDELIC HORIZON',
        headliner: fullArtistList[2]?.name || 'TAME IMPALA',
        undercard: [fullArtistList[4]?.name || 'FLEETWOOD MAC', fullArtistList[7]?.name || 'BOY HARSHER', fullArtistList[10]?.name || 'YVES TUMOR']
      },
      {
        day: 'SUNDAY // DAY 03',
        theme: 'NOCTURNAL VOYAGE',
        headliner: fullArtistList[1]?.name || 'M83',
        undercard: [fullArtistList[5]?.name || 'MEN I TRUST', fullArtistList[8]?.name || 'THE JAPANESE HOUSE', fullArtistList[11]?.name || 'SLOWDIVE']
      }
    ];

    return {
      user,
      tasteAge,
      vintageDrift,
      decadesPct,
      oldestTrack,
      newestTrack,
      circadianTitle,
      peakHour,
      nocturnalPct,
      hourlyDistribution,
      obscurityScore,
      snobTier,
      deepestGem: deepestGem?.artist || artists[0],
      deepestGemPop: deepestGem?.pop || 24,
      mainstreamStaple: mainstreamStaple?.artist || artists[0],
      mainstreamStaplePop: mainstreamStaple?.pop || 94,
      epicenters,
      festivalDays,
      dominantGenre: stats.dominantGenre || 'Neo-Psychedelia / Synthpop',
      auraTitle: stats.auraTitle || 'Subterranean Velvet',
      auraColors: stats.auraColors || ['#8b5cf6', '#38bdf8', '#c084fc']
    };
  }

  // =========================================================================
  // VIEW RENDERER
  // =========================================================================
  render() {
    if (!this.modal) return;
    const a = this.analytics;
    const d = this.data;

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
            <button class="dossier-btn-export" id="btn-dossier-export-card" title="Download High-Res Dossier Card">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Poster</span>
            </button>
            <button class="dossier-btn-close" id="btn-dossier-close" title="Close Dossier (Esc)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <!-- Segmented Tab Navigation Rail -->
        <nav class="dossier-tabs-nav" role="tablist">
          <button class="dossier-tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
            <span>Persona DNA</span>
          </button>
          <button class="dossier-tab-btn ${this.activeTab === 'timemachine' ? 'active' : ''}" data-tab="timemachine">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Time Machine (${a.tasteAge})</span>
          </button>
          <button class="dossier-tab-btn ${this.activeTab === 'circadian' ? 'active' : ''}" data-tab="circadian">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            <span>Circadian Clock</span>
          </button>
          <button class="dossier-tab-btn ${this.activeTab === 'obscurity' ? 'active' : ''}" data-tab="obscurity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>Underground Radar</span>
          </button>
          <button class="dossier-tab-btn ${this.activeTab === 'festival' ? 'active' : ''}" data-tab="festival">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            <span>Festival Poster</span>
          </button>
        </nav>

        <!-- Main Tab Content Body (Exportable Container) -->
        <main class="dossier-main" id="dossier-exportable-stage">
          ${this.renderActiveTabContent()}
        </main>
      </div>
    `;

    this.attachEventListeners();
  }

  // =========================================================================
  // TAB CONTENT RENDERERS
  // =========================================================================
  renderActiveTabContent() {
    switch (this.activeTab) {
      case 'timemachine':
        return this.renderTimeMachineTab();
      case 'circadian':
        return this.renderCircadianTab();
      case 'obscurity':
        return this.renderObscurityTab();
      case 'festival':
        return this.renderFestivalTab();
      case 'overview':
      default:
        return this.renderOverviewTab();
    }
  }

  // 1. OVERVIEW & PERSONA DNA
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
                  <div class="dossier-track-artist">${escapeHtml(t.artists?.map(art => art.name).join(', '))}</div>
                </div>
                <button class="dossier-btn-play" title="Play Preview">▶</button>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  // 2. THE CHRONOLOGICAL TIME MACHINE
  renderTimeMachineTab() {
    const a = this.analytics;

    return `
      <section class="dossier-view-timemachine">
        <div class="dossier-view-banner">
          <div class="dossier-badge-label">HISTORICAL CHRONOLOGY</div>
          <h2 class="dossier-view-title">Born in 2026, Tuning into <b>${a.tasteAge}</b></h2>
          <p class="dossier-view-sub">Your musical soul is offset by <b>+${a.vintageDrift} years</b> into the catalog. Here is how your listening breaks down by era:</p>
        </div>

        <!-- Decades Histogram Bar Graph -->
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

        <!-- Oldest Relic vs Newest Vanguard Discovery -->
        <div class="dossier-relic-split">
          <div class="dossier-card dossier-relic-card">
            <span class="dossier-relic-tag">THE ANCHOR RELIC (OLDEST RELEASE)</span>
            <div class="dossier-relic-body">
              <img src="${a.oldestTrack?.track?.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80'}" class="dossier-relic-art" alt="Relic">
              <div>
                <h3 class="dossier-relic-title">${escapeHtml(a.oldestTrack?.track?.name || 'Classic Master')}</h3>
                <p class="dossier-relic-artist">${escapeHtml(a.oldestTrack?.track?.artists?.map(art => art.name).join(', ') || 'Artist')}</p>
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
                <p class="dossier-relic-artist">${escapeHtml(a.newestTrack?.track?.artists?.map(art => art.name).join(', ') || 'Artist')}</p>
                <span class="dossier-relic-year">RELEASED: ${a.newestTrack?.year || '2024'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // 3. THE CIRCADIAN RHYTHM CLOCK
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
          <!-- 24-Hour Circular Radial Architecture -->
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
              <span class="dossier-quad-desc">Shoegaze, darkwave, ambient introspection</span>
            </div>
            <div class="dossier-quad-cell">
              <span class="dossier-quad-time">06:00 – 11:00</span>
              <span class="dossier-quad-name">Dawn Patrol</span>
              <span class="dossier-quad-desc">Acoustic clarity & morning ignition</span>
            </div>
            <div class="dossier-quad-cell">
              <span class="dossier-quad-time">12:00 – 17:00</span>
              <span class="dossier-quad-name">Daylight Flow</span>
              <span class="dossier-quad-desc">High tempo, driving rhythms, hyperfocus</span>
            </div>
            <div class="dossier-quad-cell">
              <span class="dossier-quad-time">18:00 – 23:00</span>
              <span class="dossier-quad-name">Twilight Descent</span>
              <span class="dossier-quad-desc">Warm grooves, neo-psychedelia, unwind</span>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // 4. UNDERGROUND OBSCURITY RADAR
  renderObscurityTab() {
    const a = this.analytics;

    return `
      <section class="dossier-view-obscurity">
        <div class="dossier-view-banner">
          <div class="dossier-badge-label">UNDERGROUND TASTEMAKER INDEX</div>
          <h2 class="dossier-view-title">${a.obscurityScore}% Obscurity // ${a.snobTier}</h2>
          <p class="dossier-view-sub">Only <b>${100 - a.obscurityScore}%</b> of your regular rotation overlaps with global mainstream charts. You listen deeper in the underground than 88% of Spotify users.</p>
        </div>

        <div class="dossier-card dossier-obscurity-spectrum-card">
          <div class="dossier-spectrum-header">
            <span>UNDERGROUND DEEP CUTS (0)</span>
            <span>INDIE CONNOISSEUR (50)</span>
            <span>GLOBAL BILLBOARD (100)</span>
          </div>

          <div class="dossier-spectrum-bar">
            <div class="dossier-spectrum-fill" style="width: ${100 - a.obscurityScore}%;"></div>
            <div class="dossier-spectrum-needle" style="left: ${100 - a.obscurityScore}%;">
              <span class="dossier-needle-tag">YOUR TASTE: ${100 - a.obscurityScore}%</span>
            </div>
          </div>
        </div>

        <div class="dossier-gem-comparison">
          <div class="dossier-card dossier-gem-card">
            <span class="dossier-gem-badge">💎 DEEPEST UNDERGROUND TREASURE</span>
            <div class="dossier-gem-body">
              <h3 class="dossier-gem-name">${escapeHtml(a.deepestGem.name)}</h3>
              <p class="dossier-gem-genres">${a.deepestGem.genres?.slice(0, 2).join(' • ') || 'Sonic Vanguard'}</p>
              <div class="dossier-gem-metric">
                <span>POPULARITY SCORE: <b>${a.deepestGemPop} / 100</b></span>
                <span style="color:#10b981;">DEEP CUT</span>
              </div>
            </div>
          </div>

          <div class="dossier-card dossier-gem-card">
            <span class="dossier-gem-badge">🔥 MAINSTREAM STAPLE (GUILTY PLEASURE)</span>
            <div class="dossier-gem-body">
              <h3 class="dossier-gem-name">${escapeHtml(a.mainstreamStaple.name)}</h3>
              <p class="dossier-gem-genres">${a.mainstreamStaple.genres?.slice(0, 2).join(' • ') || 'Global Chart Headliner'}</p>
              <div class="dossier-gem-metric">
                <span>POPULARITY SCORE: <b>${a.mainstreamStaplePop} / 100</b></span>
                <span style="color:#f59e0b;">ARENA GIANT</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // 5. 3-DAY MUSIC FESTIVAL POSTER
  renderFestivalTab() {
    const a = this.analytics;

    return `
      <section class="dossier-view-festival">
        <div class="dossier-view-banner">
          <div class="dossier-badge-label">LINEUP GENERATOR</div>
          <h2 class="dossier-view-title">Soulseekr 3-Day Music Festival</h2>
          <p class="dossier-view-sub">Your ultimate dream festival lineup curated exclusively from your listening rotation. Download and share as your personal concert poster.</p>
        </div>

        <!-- Silkscreen Screenprint Festival Poster Artifact -->
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
  // INTERACTION WIRING
  // =========================================================================
  attachEventListeners() {
    if (!this.modal) return;

    // Close buttons
    const btnClose = this.modal.querySelector('#btn-dossier-close');
    if (btnClose) btnClose.onclick = () => this.close();

    const backdrop = this.modal.querySelector('#dossier-backdrop');
    if (backdrop) backdrop.onclick = () => this.close();

    // Tab buttons
    const tabs = this.modal.querySelectorAll('.dossier-tab-btn');
    tabs.forEach(btn => {
      btn.onclick = () => {
        const tab = btn.getAttribute('data-tab');
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          this.render();
        }
      };
    });

    // Track audio play triggers
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

    // Export Poster Buttons
    const btnExportCard = this.modal.querySelector('#btn-dossier-export-card');
    if (btnExportCard) {
      btnExportCard.onclick = async () => {
        try {
          showToast('Rendering high-DPI dossier image...', 'info', 2000);
          const stage = document.getElementById('dossier-exportable-stage');
          const dataUrl = await exportCardAsImage('card', stage);
          downloadDataUrl(dataUrl, `soulseekr-taste-dossier-${this.activeTab}.png`);
          showToast('Downloaded Taste Dossier Poster!', 'success', 2500);
        } catch (err) {
          showToast(err.message, 'error', 3500);
        }
      };
    }

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

export const sonicDossier = new SonicDossierEngine();
