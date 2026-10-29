/**
 * Soulseekr listening dossier and its five analysis departments.
 */

import { soundEngine } from './audio-player.js';
import { showToast } from './app.js';
import { exportCardAsImage, downloadDataUrl } from './exporter.js';
import { escapeHtml, formatDuration } from './card-renderer.js';
import { audioDna } from './audio-dna.js';
import { matchDirector, renderCriterionPosterHtml, renderSynesthesiaHtml, SynesthesiaBarcodeController } from './cinema-synesthesia.js';
import { fetchLiveWeatherData, computeBarometricSplit, renderWeatherChaserHtml, WeatherTimelineController } from './weather-chaser.js';
import { resolvePassportMetrics, renderBoardingPassHtml, FlightMapController, computeSubconsciousMind, renderSubconsciousMindHtml } from './world-passport.js';
import { SPOTIFY_TIME_RANGES, loadComparisonRanges } from './spotify-api.js';

const COMPARISON_LIMIT = 20;

function itemKey(item) {
  return item?.id || `${item?.name || ''}:${item?.artists?.[0]?.name || ''}`;
}

function rangeLabel(range) {
  return SPOTIFY_TIME_RANGES[range]?.shortLabel || range;
}

function getRangeSnapshot(data, currentRange, range) {
  if (data?.comparisonRanges?.[range]) return data.comparisonRanges[range];
  if (range === currentRange) {
    return {
      tracks: data?.topTracks || [],
      artists: data?.topArtists || [],
      status: { tracks: 'available', artists: 'available' }
    };
  }
  return {
    tracks: [],
    artists: [],
    status: { tracks: 'unavailable', artists: 'unavailable' }
  };
}

function averageReleaseYear(tracks) {
  const years = tracks
    .map(track => Number.parseInt(track?.album?.release_date?.slice(0, 4), 10))
    .filter(Number.isFinite);
  if (!years.length) return null;
  return Math.round(years.reduce((sum, year) => sum + year, 0) / years.length);
}

function leadingGenre(artists) {
  const counts = new Map();
  artists.forEach(artist => {
    (artist?.genres || []).forEach(genre => counts.set(genre, (counts.get(genre) || 0) + 1));
  });
  const first = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!first) return 'No genre tags returned';
  return first[0].replace(/\b\w/g, letter => letter.toUpperCase());
}

function buildPeriodComparison(data, currentRange, leftRange, rightRange) {
  const left = getRangeSnapshot(data, currentRange, leftRange);
  const right = getRangeSnapshot(data, currentRange, rightRange);
  const leftTracks = (left.tracks || []).slice(0, COMPARISON_LIMIT);
  const rightTracks = (right.tracks || []).slice(0, COMPARISON_LIMIT);
  const leftArtists = (left.artists || []).slice(0, COMPARISON_LIMIT);
  const rightArtists = (right.artists || []).slice(0, COMPARISON_LIMIT);
  const rightTrackKeys = new Set(rightTracks.map(itemKey));
  const rightArtistRanks = new Map(rightArtists.map((artist, index) => [itemKey(artist), index + 1]));
  const leftArtistRanks = new Map(leftArtists.map((artist, index) => [itemKey(artist), index + 1]));

  const sharedTracks = leftTracks.filter(track => rightTrackKeys.has(itemKey(track)));
  const sharedArtists = leftArtists.filter(artist => rightArtistRanks.has(itemKey(artist)));
  const arrivals = leftArtists.filter(artist => !rightArtistRanks.has(itemKey(artist))).slice(0, 5);
  const movers = sharedArtists
    .map(artist => ({
      artist,
      leftRank: leftArtistRanks.get(itemKey(artist)),
      rightRank: rightArtistRanks.get(itemKey(artist))
    }))
    .map(entry => ({ ...entry, shift: entry.rightRank - entry.leftRank }))
    .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift))
    .slice(0, 6);

  let reading = 'A sharp turn in your recent rotation';
  if (sharedArtists.length >= 12) reading = 'A steady core with small rank changes';
  else if (sharedArtists.length >= 6) reading = 'A familiar core with visible drift';

  return {
    left,
    right,
    leftTracks,
    rightTracks,
    leftArtists,
    rightArtists,
    sharedTracks,
    sharedArtists,
    arrivals,
    movers,
    reading,
    leftAverageYear: averageReleaseYear(leftTracks),
    rightAverageYear: averageReleaseYear(rightTracks),
    leftGenre: leadingGenre(leftArtists),
    rightGenre: leadingGenre(rightArtists)
  };
}

export class SonicDossierEngine {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.data = null;
    this.timeRange = 'short_term';
    
    // Modular Departments: 'cinema', 'audiodna', 'weather', 'world', 'sources'
    this.activeDept = 'cinema';
    this.activeSub = {
      cinema: 'criterion',     // 'criterion' | 'synesthesia'
      audiodna: 'explorer',    // 'explorer' | 'overview' | 'comparison' | 'timemachine' | 'circadian' | 'obscurity'
      weather: 'stormchaser',  // 'stormchaser'
      world: 'boardingpass',   // 'boardingpass' | 'subconscious' | 'festival'
      sources: 'provenance'
    };
    this.comparisonLeft = 'short_term';
    this.comparisonRight = 'medium_term';

    this.weatherData = null;
    this.weatherRequestId = 0;
    this.isWeatherFetching = false;
    this.activeControllers = {
      barcode: null,
      weatherTimeline: null,
      flightMap: null
    };

    this.analytics = null;
    this.returnFocus = null;
    this.spotlightTrack = null;
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.unsubscribeSoundState = soundEngine.onStateChange(state => this.updatePlaybackUi(state));
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

  pickRandomSpotlightTrack(previousTrackId = null) {
    const tracks = this.data?.topTracks;
    if (!Array.isArray(tracks) || tracks.length === 0) return null;
    if (tracks.length === 1) return tracks[0];
    const pool = previousTrackId ? tracks.filter(t => t && t.id !== previousTrackId) : tracks;
    const candidates = pool.length > 0 ? pool : tracks;
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  async open(data, timeRange = 'short_term') {
    if (this.data !== data) {
      this.weatherRequestId += 1;
      this.weatherData = null;
      this.isWeatherFetching = false;
    }
    this.returnFocus = document.activeElement;
    this.data = data;
    this.timeRange = timeRange;
    this.comparisonLeft = timeRange;
    this.comparisonRight = timeRange === 'short_term' ? 'medium_term' : 'short_term';
    this.analytics = this.computeAnalytics(data, timeRange);
    this.spotlightTrack = this.pickRandomSpotlightTrack();

    this.ensureDom();
    this.modal.classList.add('is-open');
    this.modal.setAttribute('aria-hidden', 'false');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', this.onKeyDown);
    this.render();
    requestAnimationFrame(() => this.modal.querySelector('#btn-dossier-close')?.focus());
  }

  close() {
    if (!this.modal) return;
    this.cleanupControllers();

    if (this.activeDept === 'audiodna' && this.activeSub.audiodna === 'explorer') {
      audioDna.destroy();
    }

    if (this.spotlightTrack && soundEngine.isPlaying && soundEngine.currentTrackId === this.spotlightTrack.id) {
      soundEngine.stop();
    }

    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.isOpen = false;
    document.body.style.overflow = '';
    window.removeEventListener('keydown', this.onKeyDown);
    if (this.returnFocus instanceof HTMLElement) this.returnFocus.focus();
    this.returnFocus = null;
  }

  cleanupControllers() {
    if (this.activeControllers.flightMap) {
      this.activeControllers.flightMap.destroy();
      this.activeControllers.flightMap = null;
    }
    if (this.activeControllers.barcode) {
      this.activeControllers.barcode.destroy();
      this.activeControllers.barcode = null;
    }
    if (this.activeControllers.weatherTimeline) {
      this.activeControllers.weatherTimeline.destroy();
      this.activeControllers.weatherTimeline = null;
    }
  }

  handleKeyDown(e) {
    if (!this.isOpen) return;
    if (e.key === 'Escape') {
      this.close();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = [...this.modal.querySelectorAll('button, select, [href], [tabindex]:not([tabindex="-1"])')]
      .filter(element => !element.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // =========================================================================
  // ANALYTICS & STATS ENGINE
  // =========================================================================
  computeAnalytics(data, timeRange) {
    const tracks = data.topTracks || [];
    const artists = data.topArtists || [];
    const user = data.user || { display_name: '', images: [] };
    const stats = data.stats || {};

    // 1. Taste Age & Vintage Drift
    const currentYear = new Date().getFullYear();
    const releaseYears = tracks
      .map(t => {
        const d = t.album?.release_date;
        return d ? parseInt(d.slice(0, 4), 10) : NaN;
      })
      .filter(y => !isNaN(y));

    const avgReleaseYear = releaseYears.length
      ? Math.round(releaseYears.reduce((a, b) => a + b, 0) / releaseYears.length)
      : null;

    const vintageDrift = avgReleaseYear === null ? null : Math.max(0, currentYear - avgReleaseYear);

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
    let peakHourIndex = null;
    for (let h = 0; h < 24; h++) {
      if (hourWeights[h] > maxWeight) {
        maxWeight = hourWeights[h];
        peakHourIndex = h;
      }
    }

    const peakHour = peakHourIndex === null ? null : `${peakHourIndex < 10 ? '0' : ''}${peakHourIndex}:00`;
    let circadianTitle = null;
    if (peakHourIndex !== null && peakHourIndex >= 0 && peakHourIndex < 5) circadianTitle = "Nocturnal listener";
    else if (peakHourIndex >= 5 && peakHourIndex < 9) circadianTitle = "Dawn Patrol Pioneer";
    else if (peakHourIndex >= 9 && peakHourIndex < 17) circadianTitle = "High-Noon Dynamo";
    else if (peakHourIndex >= 17 && peakHourIndex < 21) circadianTitle = "Dusk Alchemist";
    else if (peakHourIndex !== null) circadianTitle = "Evening listener";

    const nightPlays = hourWeights.slice(22).reduce((a, b) => a + b, 0) + hourWeights.slice(0, 5).reduce((a, b) => a + b, 0);
    const totalPlays = hourWeights.reduce((a, b) => a + b, 0);
    const nocturnalPct = totalPlays ? Math.round((nightPlays / totalPlays) * 100) : null;

    const hourlyDistribution = hourWeights.map((w, h) => ({
      hour: h,
      label: `${h < 10 ? '0' : ''}${h}:00`,
      weight: maxWeight ? w / maxWeight : 0
    }));

    // 4. Obscurity & Snob Index (falls back to ranked tracks if topArtists is sparse)
    const popValues = artists.map(a => Number(a?.popularity)).filter(Number.isFinite);
    const effectivePopValues = popValues.length
      ? popValues
      : tracks.map(t => Number(t?.popularity)).filter(Number.isFinite);

    const avgPopularity = effectivePopValues.length
      ? Math.round(effectivePopValues.reduce((a, b) => a + b, 0) / effectivePopValues.length)
      : null;

    const obscurityScore = avgPopularity === null ? null : Math.max(0, Math.min(100, 100 - avgPopularity));
    let snobTier = null;
    if (obscurityScore !== null && obscurityScore >= 85) snobTier = "Subterranean Purist";
    else if (obscurityScore >= 70) snobTier = "Crate Digger Elite";
    else if (obscurityScore >= 50) snobTier = "Discriminating Listener";
    else if (obscurityScore !== null) snobTier = "Mainstream Connoisseur";

    // 5. Track Pacing & Catalog Diversity Proxies
    const trackDurations = tracks.map(t => Number(t.duration_ms) || 0).filter(d => d > 0);
    const avgTrackSeconds = trackDurations.length
      ? Math.round((trackDurations.reduce((sum, d) => sum + d, 0) / trackDurations.length) / 1000)
      : 210;
    const uniqueArtistsCount = new Set(
      tracks.flatMap(t => (t.artists || []).map(a => (typeof a === 'object' ? a.name : a) || '')).filter(Boolean)
    ).size;
    const artistDiversityPct = tracks.length ? Math.round((uniqueArtistsCount / tracks.length) * 100) : 50;

    // Most obscure crate discovery
    const sortedByPop = artists.filter(a => Number.isFinite(Number(a?.popularity))).sort((a, b) => a.popularity - b.popularity);
    const rarestGem = sortedByPop[0] || null;
    const mainstreamStaple = [...sortedByPop].reverse()[0] || null;

    // Oldest release vs newest release
    const sortedTracksByYear = tracks.filter(track => /^\d{4}/.test(track.album?.release_date || '')).sort((a, b) => {
      const ya = parseInt(a.album.release_date.slice(0, 4), 10);
      const yb = parseInt(b.album.release_date.slice(0, 4), 10);
      return ya - yb;
    });

    const oldestTrack = sortedTracksByYear[0] || null;
    const newestTrack = sortedTracksByYear[sortedTracksByYear.length - 1] || null;

    // 6. Festival Lineup Generation
    const festivalDays = [
      {
        day: 'FRIDAY // NIGHT ZERO',
        theme: 'Subterranean Echoes & Neon Reverbs',
        headliner: artists[0]?.name || '',
        undercard: artists.slice(1, 6).map(a => a.name)
      },
      {
        day: 'SATURDAY // APEX DRIFT',
        theme: 'High-Voltage Psych & Groove Catharsis',
        headliner: artists[6]?.name || artists[1]?.name || '',
        undercard: artists.slice(7, 12).map(a => a.name)
      },
      {
        day: 'SUNDAY // TWILIGHT CODA',
        theme: 'Meditative Ambient & 70s Analog Masters',
        headliner: artists[12]?.name || artists[2]?.name || '',
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
      avgTrackSeconds,
      artistDiversityPct,
      snobTier,
      rarestGem: rarestGem?.name || null,
      rarestGemPop: Number.isFinite(Number(rarestGem?.popularity)) ? rarestGem.popularity : null,
      rarestGemGenres: rarestGem?.genres?.slice(0, 2).join(' • ') || null,
      oldestTrack: oldestTrack ? { track: oldestTrack, year: oldestTrack.album.release_date.slice(0, 4) } : null,
      newestTrack: newestTrack ? { track: newestTrack, year: newestTrack.album.release_date.slice(0, 4) } : null,
      mainstreamStaple: mainstreamStaple?.name || null,
      mainstreamStaplePop: Number.isFinite(Number(mainstreamStaple?.popularity)) ? mainstreamStaple.popularity : null,
      epicenters: [],
      festivalDays,
      dominantGenre: stats.dominantGenre || null,
      auraTitle: stats.auraTitle || null,
      auraColors: stats.auraColors || ['#8b5cf6', '#38bdf8', '#c084fc']
    };
  }

  renderSpotlightBar() {
    const track = this.spotlightTrack;
    if (!track) return '';

    const deptLabels = {
      cinema: 'Cinema & Synesthesia',
      audiodna: 'Audio DNA & Persona',
      weather: 'Atmosphere & Weather',
      world: 'Influence Map',
      sources: 'Method & Sources'
    };
    const deptName = deptLabels[this.activeDept] || 'Taste Dossier';

    const rankIndex = this.data?.topTracks ? this.data.topTracks.findIndex(t => t && t.id === track.id) : -1;
    const rankLabel = rankIndex >= 0 ? `Top #${rankIndex + 1}` : 'Top rotation';

    let artistName = 'Unknown artist';
    if (Array.isArray(track.artists) && track.artists.length > 0) {
      artistName = track.artists.map(art => (typeof art === 'object' && art ? art.name : art) || '').filter(Boolean).join(', ');
    } else if (track.artistName) {
      artistName = track.artistName;
    }

    const artUrl = track.album?.images?.[0]?.url || '';
    const isCurrent = soundEngine.currentTrackId === track.id;
    const isPlaying = isCurrent && soundEngine.isPlaying;
    const isPaused = isCurrent && soundEngine.isPaused;
    const isLoading = isCurrent && soundEngine.isLoading;

    const actionText = isCurrent
      ? (isLoading ? 'Loading' : isPaused ? 'Resume' : isPlaying ? 'Pause' : 'Play')
      : 'Play';

    const indicatorClass = isCurrent && isLoading
      ? 'track-indicator mini-spinner'
      : isCurrent && isPlaying
        ? 'track-indicator mini-eq'
        : isCurrent && isPaused
          ? 'track-indicator play-hint play-hint-paused'
          : 'track-indicator play-hint';

    const indicatorContent = isCurrent && isPlaying
      ? '<span class="bar"></span><span class="bar"></span><span class="bar"></span>'
      : isCurrent && isLoading
        ? ''
        : '▶';

    return `
      <section class="dossier-spotlight-bar" aria-label="Featured rotation soundtrack">
        <div class="dossier-spotlight-left">
          <div class="dossier-spotlight-tag">
            <span class="spotlight-indicator-dot" aria-hidden="true"></span>
            <span class="spotlight-label">ROTATION SPOTLIGHT</span>
            <span class="spotlight-divider" aria-hidden="true">•</span>
            <span class="spotlight-dept-context">${escapeHtml(deptName)}</span>
          </div>
          <div class="dossier-spotlight-track">
            ${artUrl
              ? `<img src="${escapeHtml(artUrl)}" class="dossier-spotlight-art" alt="" loading="lazy">`
              : '<div class="dossier-spotlight-art dossier-spotlight-art-fallback" aria-hidden="true">♪</div>'}
            <div class="dossier-spotlight-meta">
              <span class="dossier-spotlight-title">${escapeHtml(track.name || 'Untitled track')}</span>
              <span class="dossier-spotlight-artist">${escapeHtml(artistName)}</span>
            </div>
            <span class="dossier-spotlight-rank-pill">${escapeHtml(rankLabel)}</span>
          </div>
        </div>
        <div class="dossier-spotlight-actions">
          <button type="button" class="dossier-spotlight-play-btn track-play-trigger ${isCurrent && isPlaying ? 'is-playing active' : ''} ${isCurrent && isPaused ? 'is-paused' : ''} ${isCurrent && isLoading ? 'active' : ''}" data-track-id="${escapeHtml(track.id)}" aria-label="${actionText} preview for ${escapeHtml(track.name || 'track')}">
            <span class="${indicatorClass}">${indicatorContent}</span>
            <span class="spotlight-play-text">${actionText}</span>
          </button>
          <button type="button" class="dossier-spotlight-dice-btn" id="btn-dossier-shuffle-track" aria-label="Pick another random song from your most liked" title="Roll another random song from your most liked">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
              <line x1="4" y1="4" x2="9" y2="9"/>
            </svg>
            <span>Shuffle</span>
          </button>
        </div>
      </section>
    `;
  }

  // =========================================================================
  // VIEW RENDERER (Department Navigation Architecture)
  // =========================================================================
  render() {
    if (!this.modal) return;
    if (this.activeDept === 'audiodna' && this.data.provenance?.mode === 'spotify'
        && (!this.data.comparisonLoadState || this.data.comparisonLoadState === 'idle')) {
      this.loadComparisons();
    }
    const a = this.analytics;
    const profileImage = a.user.images?.[0]?.url || '';
    const profileName = a.user.display_name || a.user.id || '';
    const profileInitial = profileName.trim().charAt(0).toUpperCase();

    this.modal.innerHTML = `
      <div class="dossier-backdrop" id="dossier-backdrop"></div>

      <div class="dossier-shell">
        <!-- Top Sticky Header Chrome -->
        <header class="dossier-header">
          <div class="dossier-user-card">
            ${profileImage
              ? `<img src="${escapeHtml(profileImage)}" class="dossier-user-avatar" alt="Spotify profile">`
              : profileInitial ? `<span class="dossier-user-avatar dossier-user-avatar-placeholder" aria-hidden="true">${escapeHtml(profileInitial)}</span>` : ''}
            <div class="dossier-user-meta">
              <div class="dossier-title-row">
                <h2 class="dossier-user-name">${escapeHtml(profileName || 'Spotify profile')}</h2>
                ${a.snobTier ? `<span class="dossier-tier-badge">${escapeHtml(a.snobTier.toUpperCase())}</span>` : ''}
              </div>
              ${a.auraTitle || a.circadianTitle ? `<p class="dossier-persona-sub">${[a.auraTitle, a.circadianTitle].filter(Boolean).map(escapeHtml).join(' • ')}</p>` : ''}
            </div>
          </div>

          <div class="dossier-header-actions">
            <button class="dossier-btn-export" id="btn-dossier-export-card" title="Download High-Res Dossier Poster">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export Poster</span>
            </button>
            <button class="dossier-btn-close" id="btn-dossier-close" title="Close Dossier (Esc)" aria-label="Close Taste Dossier">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </header>

        <!-- Primary Modular Department Navigation Rail -->
        <nav class="dossier-dept-nav" role="tablist" aria-label="Dossier Departments">
          <button class="dossier-dept-btn ${this.activeDept === 'cinema' ? 'active' : ''}" data-dept="cinema" role="tab" aria-selected="${this.activeDept === 'cinema'}">
            <span class="dept-icon" aria-hidden="true">CIN</span>
            <span>Cinema &amp; Synesthesia</span>
          </button>
          <button class="dossier-dept-btn ${this.activeDept === 'audiodna' ? 'active' : ''}" data-dept="audiodna" role="tab" aria-selected="${this.activeDept === 'audiodna'}">
            <span class="dept-icon" aria-hidden="true">DNA</span>
            <span>Audio DNA &amp; Persona</span>
          </button>
          <button class="dossier-dept-btn ${this.activeDept === 'weather' ? 'active' : ''}" data-dept="weather" role="tab" aria-selected="${this.activeDept === 'weather'}">
            <span class="dept-icon" aria-hidden="true">ATM</span>
            <span>Atmosphere &amp; Weather</span>
          </button>
          <button class="dossier-dept-btn ${this.activeDept === 'world' ? 'active' : ''}" data-dept="world" role="tab" aria-selected="${this.activeDept === 'world'}">
            <span class="dept-icon" aria-hidden="true">MAP</span>
            <span>Influence Map</span>
          </button>
          <button class="dossier-dept-btn ${this.activeDept === 'sources' ? 'active' : ''}" data-dept="sources" role="tab" aria-selected="${this.activeDept === 'sources'}">
            <span class="dept-icon" aria-hidden="true">SRC</span>
            <span>Method &amp; Sources</span>
          </button>
        </nav>

        ${this.renderSpotlightBar()}

        <p class="dossier-method-note">Interpretive archive. Scores, scenes, and maps are creative readings of your catalog metadata, not Spotify measurements.</p>

        <!-- Secondary Sub-Navigation Pill Strip -->
        ${this.renderSubNavPillStrip()}

        <!-- Main Tab Content Body (Exportable Container) -->
        <main class="dossier-main" id="dossier-exportable-stage">
          ${this.renderComparisonStatus()}
          ${this.renderActiveDepartmentContent()}
        </main>
      </div>
    `;

    this.attachEventListeners();
    this.updatePlaybackUi({
      currentTrackId: soundEngine.currentTrackId,
      isPlaying: soundEngine.isPlaying,
      isPaused: soundEngine.isPaused,
      isLoading: soundEngine.isLoading
    });
  }

  loadComparisons() {
    const data = this.data;
    loadComparisonRanges(data, this.timeRange).catch(() => {
      // The snapshot carries the recovery message shown by renderComparisonStatus.
    }).finally(() => {
      if (!this.isOpen || this.data !== data || this.activeDept !== 'audiodna') return;
      const active = document.activeElement;
      const selector = active?.id ? `#${CSS.escape(active.id)}`
        : active?.dataset.dept ? `[data-dept="${active.dataset.dept}"]`
          : active?.dataset.sub ? `[data-sub="${active.dataset.sub}"]` : '';
      this.render();
      if (selector) this.modal.querySelector(selector)?.focus({ preventScroll: true });
    });
  }

  renderComparisonStatus() {
    if (this.activeDept !== 'audiodna') return '';
    const status = this.data.comparisonLoadState;
    if (!['loading', 'error', 'partial'].includes(status)) return '';
    const title = status === 'loading' ? 'Loading comparison windows'
      : status === 'partial' ? 'Some comparison windows are unavailable' : 'Comparison windows could not load';
    const message = status === 'loading' ? 'Reading the other Spotify windows for Audio DNA and period comparisons.'
      : status === 'partial' ? 'Available windows remain usable. Retry to request the missing windows; no sample history is substituted.'
        : this.data.comparisonLoadError;
    return `<div class="dossier-card provenance-empty-state comparison-load-status" role="status" aria-live="polite">
      <strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>
      ${status === 'loading' ? '' : '<button id="btn-retry-comparisons" class="dossier-btn-export" type="button">Retry comparison windows</button>'}
    </div>`;
  }

  loadWeather() {
    const requestId = ++this.weatherRequestId;
    const data = this.data;
    this.isWeatherFetching = true;
    fetchLiveWeatherData().catch(() => ({ available: false,
      reason: 'Location or weather could not be accessed. Check browser permissions and retry.'
    })).then(weather => {
      if (requestId !== this.weatherRequestId || this.data !== data) return;
      this.weatherData = weather;
      this.isWeatherFetching = false;
      if (this.isOpen && this.activeDept === 'weather') {
        const active = document.activeElement;
        const selector = active?.id ? `#${CSS.escape(active.id)}`
          : active?.dataset.dept ? `[data-dept="${active.dataset.dept}"]` : '';
        this.render();
        if (selector) this.modal.querySelector(selector)?.focus({ preventScroll: true });
      }
    });
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
          <button class="dossier-sub-pill ${active === 'comparison' ? 'active' : ''}" data-sub="comparison">
            <span>Period Comparison</span>
          </button>
          ${this.analytics.tasteAge !== null ? `<button class="dossier-sub-pill ${active === 'timemachine' ? 'active' : ''}" data-sub="timemachine">
            <span>Release History (${this.analytics.tasteAge})</span>
          </button>` : ''}
          ${this.analytics.peakHour ? `<button class="dossier-sub-pill ${active === 'circadian' ? 'active' : ''}" data-sub="circadian">
            <span>Circadian Clock (24h)</span>
          </button>` : ''}
          ${this.analytics.obscurityScore !== null ? `<button class="dossier-sub-pill ${active === 'obscurity' ? 'active' : ''}" data-sub="obscurity">
            <span>Underground Radar</span>
          </button>` : ''}
        </div>
      `;
    }

    if (this.activeDept === 'sources') {
      return `
        <div class="dossier-sub-nav">
          <button class="dossier-sub-pill active" data-sub="provenance">
            <span>Data Provenance Ledger</span>
          </button>
        </div>
      `;
    }

    if (this.activeDept === 'weather') {
      return `
        <div class="dossier-sub-nav">
          <button class="dossier-sub-pill active" data-sub="stormchaser">
            <span>Current local weather</span>
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
      if (['loading', 'error'].includes(this.data.comparisonLoadState)) return '';
      const sub = this.activeSub.audiodna;
      if (sub === 'explorer') {
        return '<div id="dna-mount-point" class="dna-container-mount"></div>';
      }
      if (sub === 'comparison') return this.renderPeriodComparisonTab();
      if (sub === 'timemachine') return this.renderTimeMachineTab();
      if (sub === 'circadian') return this.renderCircadianTab();
      if (sub === 'obscurity') return this.renderObscurityTab();
      return this.renderOverviewTab();
    }

    // 3. Atmosphere & Weather
    if (this.activeDept === 'weather') {
      if (!this.weatherData && !this.isWeatherFetching) {
        this.loadWeather();
      }
      if (this.isWeatherFetching) {
        return `<div class="dossier-card provenance-empty-state dossier-recovery-status" role="status" aria-live="polite"><strong>Loading local weather</strong><span>Your location is sent to Open-Meteo to retrieve current conditions. No Spotify history is sent with this request.</span></div>`;
      }
      if (!this.weatherData?.available) {
        return `<div class="dossier-card provenance-empty-state dossier-recovery-status" role="status" aria-live="polite"><strong>Local weather unavailable</strong><span>${escapeHtml(this.weatherData?.reason || 'Allow location access and check your connection.')}</span><span>Retry requests your location and sends it to Open-Meteo for current weather.</span><button id="btn-retry-weather" class="dossier-btn-export" type="button">Retry local weather</button></div>`;
      }
      const weather = this.weatherData;
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

    if (this.activeDept === 'sources') {
      return this.renderProvenanceTab();
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
          <h1 class="dossier-hero-headline">Your listening record</h1>
          <p class="dossier-hero-description">This panel only includes fields calculated from Spotify's returned rankings${a.dominantGenre ? `, led by <b>${escapeHtml(a.dominantGenre)}</b>` : ''}.</p>

          <div class="dossier-stat-pill-row">
            ${a.tasteAge !== null ? `<div class="dossier-pill-box">
              <span class="dossier-pill-val">${a.tasteAge}</span>
              <span class="dossier-pill-lbl">AVERAGE RELEASE YEAR</span>
            </div>` : ''}
            ${a.obscurityScore !== null ? `<div class="dossier-pill-box">
              <span class="dossier-pill-val">${a.obscurityScore}%</span>
              <span class="dossier-pill-lbl">RARITY INDEX</span>
            </div>` : ''}
            ${a.peakHour ? `<div class="dossier-pill-box">
              <span class="dossier-pill-val">${a.peakHour}</span>
              <span class="dossier-pill-lbl">RECENT-PLAY PEAK</span>
            </div>` : ''}
          </div>
        </div>

        <!-- Sonic Passport Geographic Footprint -->
        ${a.epicenters.length ? `<div class="dossier-card dossier-card-passport">
          <div class="dossier-card-header">
            <span class="dossier-card-title">SONIC PASSPORT // INFLUENCE MAP</span>
            <span class="dossier-card-sub">AN INTERPRETIVE MICRO-GENRE STUDY</span>
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
        </div>` : ''}

        <!-- Top Reference Rotation with 30s Studio Audio Previews -->
        <div class="dossier-card dossier-card-tracks">
          <div class="dossier-card-header">
            <span class="dossier-card-title">DOMINANT ROTATION // AUDIO PREVIEWS</span>
            <span class="dossier-card-sub">SELECT A TRACK TO PLAY</span>
          </div>
          <div class="dossier-tracks-stream">
            ${tracks.slice(0, 4).map((t, idx) => `
              <div class="dossier-track-item track-play-trigger" data-track-id="${t.id}">
                <span class="dossier-track-rank">0${idx + 1}</span>
                ${t.album?.images?.[0]?.url
                  ? `<img src="${escapeHtml(t.album.images[0].url)}" class="dossier-track-art" alt="Album cover">`
                  : ''}
                <div class="dossier-track-info">
                  <div class="dossier-track-name">${escapeHtml(t.name)}</div>
                  <div class="dossier-track-artist">${escapeHtml(Array.isArray(t.artists) ? t.artists.map(art => (art && typeof art === 'object' ? art.name : art) || '').filter(Boolean).join(', ') : (t.artistName || 'Artist'))}</div>
                </div>
                <span class="dossier-btn-play" aria-hidden="true">▶</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  renderPeriodComparisonTab() {
    const leftRange = this.comparisonLeft;
    const rightRange = this.comparisonRight;
    const comparison = buildPeriodComparison(this.data, this.timeRange, leftRange, rightRange);
    const optionsFor = (selected, unavailableChoice) => Object.keys(SPOTIFY_TIME_RANGES).map(range => `
      <option value="${range}" ${range === selected ? 'selected' : ''} ${range === unavailableChoice ? 'disabled' : ''}>
        ${escapeHtml(SPOTIFY_TIME_RANGES[range].label)}
      </option>
    `).join('');
    const hasBothPeriods = comparison.leftTracks.length > 0
      && comparison.rightTracks.length > 0
      && comparison.leftArtists.length > 0
      && comparison.rightArtists.length > 0;

    if (!hasBothPeriods) {
      return `
        <section class="comparison-view">
          <div class="dossier-view-banner comparison-banner">
            <div class="dossier-badge-label">PERIOD COMPARISON</div>
            <h2 class="dossier-view-title">Not enough ranked history to compare</h2>
            <p class="dossier-view-sub">Spotify did not return tracks and artists for both selected windows. Choose another pair, or revisit after your listening history has had time to develop.</p>
          </div>
          <div class="comparison-period-controls" aria-label="Comparison windows">
            <label class="comparison-period-field">
              <span>Primary window</span>
              <select id="comparison-left-range" data-comparison-side="left">
                ${optionsFor(leftRange, rightRange)}
              </select>
            </label>
            <span class="comparison-versus" aria-hidden="true">vs</span>
            <label class="comparison-period-field">
              <span>Reference window</span>
              <select id="comparison-right-range" data-comparison-side="right">
                ${optionsFor(rightRange, leftRange)}
              </select>
            </label>
          </div>
          <div class="dossier-card provenance-empty-state" role="status">
            <strong>Comparison unavailable for this pair.</strong>
            <span>No substitute period was inserted.</span>
          </div>
        </section>
      `;
    }

    const renderTrackList = (tracks, range) => `
      <section class="comparison-period-column" aria-label="Top tracks for ${escapeHtml(rangeLabel(range))}">
        <header class="comparison-column-header">
          <div>
            <span class="comparison-column-index">${escapeHtml(rangeLabel(range))}</span>
            <h3>Track register</h3>
          </div>
          <span>${tracks.length} shown</span>
        </header>
        <ol class="comparison-track-list">
          ${tracks.slice(0, 5).map((track, index) => `
            <li>
              <span class="comparison-rank">${String(index + 1).padStart(2, '0')}</span>
              ${track.album?.images?.[0]?.url
                ? `<img src="${escapeHtml(track.album.images[0].url)}" alt="" class="comparison-track-art">`
                : '<span class="comparison-track-art artwork-placeholder" aria-hidden="true"></span>'}
              <span class="comparison-track-copy">
                <strong>${escapeHtml(track.name || 'Untitled track')}</strong>
                <small>${escapeHtml(Array.isArray(track.artists) ? track.artists.map(artist => artist?.name || artist).filter(Boolean).join(', ') : (track.artistName || 'Artist'))}</small>
              </span>
            </li>
          `).join('')}
        </ol>
        <dl class="comparison-period-facts">
          <div>
            <dt>Leading genre</dt>
            <dd>${escapeHtml(range === leftRange ? comparison.leftGenre : comparison.rightGenre)}</dd>
          </div>
          <div>
            <dt>Mean release year</dt>
            <dd>${range === leftRange ? (comparison.leftAverageYear || 'Unavailable') : (comparison.rightAverageYear || 'Unavailable')}</dd>
          </div>
        </dl>
      </section>
    `;

    return `
      <section class="comparison-view">
        <div class="dossier-view-banner comparison-banner">
          <div class="dossier-badge-label">PERIOD COMPARISON</div>
          <h2 class="dossier-view-title">What changed in your rotation?</h2>
          <p class="dossier-view-sub">Compare Spotify affinity rankings across two official windows. Rank movement is relative to these lists, not a count of streams.</p>
        </div>

        <div class="comparison-period-controls" aria-label="Comparison windows">
          <label class="comparison-period-field">
            <span>Primary window</span>
            <select id="comparison-left-range" data-comparison-side="left">
              ${optionsFor(leftRange, rightRange)}
            </select>
          </label>
          <span class="comparison-versus" aria-hidden="true">vs</span>
          <label class="comparison-period-field">
            <span>Reference window</span>
            <select id="comparison-right-range" data-comparison-side="right">
              ${optionsFor(rightRange, leftRange)}
            </select>
          </label>
        </div>

        <div class="comparison-reading-card">
          <span class="comparison-reading-label">Local reading</span>
          <strong>${escapeHtml(comparison.reading)}</strong>
          <p>${comparison.sharedArtists.length} artists and ${comparison.sharedTracks.length} tracks appear in both top-${COMPARISON_LIMIT} registers.</p>
        </div>

        <div class="comparison-register-grid">
          ${renderTrackList(comparison.leftTracks, leftRange)}
          ${renderTrackList(comparison.rightTracks, rightRange)}
        </div>

        <div class="comparison-analysis-grid">
          <section class="dossier-card comparison-movers-card">
            <div class="dossier-card-header">
              <span class="dossier-card-title">SHARED ARTIST RANK MOVEMENT</span>
              <span class="dossier-card-sub">TOP ${COMPARISON_LIMIT}</span>
            </div>
            <div class="comparison-movers-list">
              ${comparison.movers.length ? comparison.movers.map(entry => {
                const movement = entry.shift > 0
                  ? `${entry.shift} place${entry.shift === 1 ? '' : 's'} higher in ${rangeLabel(leftRange)}`
                  : entry.shift < 0
                    ? `${Math.abs(entry.shift)} place${Math.abs(entry.shift) === 1 ? '' : 's'} lower in ${rangeLabel(leftRange)}`
                    : 'Same rank in both windows';
                return `
                  <div class="comparison-mover-row">
                    <span class="comparison-mover-name">${escapeHtml(entry.artist.name || 'Unknown artist')}</span>
                    <span class="comparison-mover-ranks">#${entry.leftRank} / #${entry.rightRank}</span>
                    <span class="comparison-mover-shift">${escapeHtml(movement)}</span>
                  </div>
                `;
              }).join('') : '<p class="comparison-no-result">No shared top artists were returned for these windows.</p>'}
            </div>
          </section>

          <section class="dossier-card comparison-arrivals-card">
            <div class="dossier-card-header">
              <span class="dossier-card-title">PRIMARY-WINDOW ARRIVALS</span>
              <span class="dossier-card-sub">NOT IN REFERENCE TOP ${COMPARISON_LIMIT}</span>
            </div>
            ${comparison.arrivals.length ? `
              <ol class="comparison-arrivals-list">
                ${comparison.arrivals.map(artist => `<li>${escapeHtml(artist.name || 'Unknown artist')}</li>`).join('')}
              </ol>
            ` : '<p class="comparison-no-result">The primary window has no new names outside the reference top list.</p>'}
          </section>
        </div>

        <p class="comparison-source-note">Source: Spotify Web API top tracks and top artists, up to 50 ranked items per window. Soulseekr compares the first ${COMPARISON_LIMIT} entries.</p>
      </section>
    `;
  }

  renderProvenanceTab() {
    const provenance = this.data?.provenance || {
      mode: 'sample',
      retrievedAt: null,
      selectedRange: this.timeRange,
      scopes: [],
      sources: [],
      calculations: []
    };
    const retrievedDate = provenance.retrievedAt
      ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(provenance.retrievedAt))
      : 'Sample archive, no live retrieval';
    const ranges = Object.entries(this.data?.comparisonRanges || {});

    return `
      <section class="provenance-view">
        <div class="dossier-view-banner provenance-banner">
          <div class="dossier-badge-label">DATA PROVENANCE</div>
          <h2 class="dossier-view-title">Every result gets a paper trail</h2>
          <p class="dossier-view-sub">Direct Spotify fields, local calculations, and creative interpretations are separated here so the archive never implies more certainty than the source provides.</p>
        </div>

        <div class="provenance-summary-strip">
          <div>
            <span>Archive mode</span>
            <strong>${provenance.mode === 'spotify' ? 'Connected Spotify data' : 'Clearly labelled sample data'}</strong>
          </div>
          <div>
            <span>Retrieved</span>
            <strong>${escapeHtml(retrievedDate)}</strong>
          </div>
          <div>
            <span>Selected window</span>
            <strong>${escapeHtml(SPOTIFY_TIME_RANGES[provenance.selectedRange]?.label || provenance.selectedRange)}</strong>
          </div>
        </div>

        <div class="provenance-legend" aria-label="Provenance classifications">
          <span><b class="provenance-key key-direct">Direct</b> Returned by Spotify</span>
          <span><b class="provenance-key key-derived">Derived</b> Calculated from returned fields</span>
          <span><b class="provenance-key key-interpretive">Interpretive</b> Creative Soulseekr reading</span>
        </div>

        <section class="dossier-card provenance-ledger-card">
          <div class="dossier-card-header">
            <span class="dossier-card-title">SOURCE LEDGER</span>
            <span class="dossier-card-sub">CURRENT ARCHIVE</span>
          </div>
          <div class="provenance-ledger">
            ${(provenance.sources || []).map(source => `
              <article class="provenance-row">
                <div class="provenance-row-main">
                  <span class="provenance-key key-direct">Direct</span>
                  <div>
                    <h3>${escapeHtml(source.label)}</h3>
                    <code>${escapeHtml(source.endpoint)}</code>
                  </div>
                </div>
                <div class="provenance-row-status">
                  <strong>${source.status === 'available' ? 'Available' : 'Unavailable'}</strong>
                  <span>${Number(source.count) || 0} ${Number(source.count) === 1 ? 'record' : 'records'}</span>
                </div>
              </article>
            `).join('') || `
              <div class="provenance-empty-state" role="status">
                <strong>No live Spotify requests in the sample archive.</strong>
                <span>Connect Spotify to populate endpoint-level retrieval details.</span>
              </div>
            `}
          </div>
        </section>

        <div class="provenance-grid">
          <section class="dossier-card provenance-method-card">
            <div class="dossier-card-header">
              <span class="dossier-card-title">LOCAL METHODS</span>
              <span class="dossier-card-sub">HOW THE ARTIFACT IS MADE</span>
            </div>
            <div class="provenance-method-list">
              ${(provenance.calculations || []).map(method => `
                <article>
                  <span class="provenance-key ${method.kind === 'interpretive' ? 'key-interpretive' : 'key-derived'}">${method.kind === 'interpretive' ? 'Interpretive' : 'Derived'}</span>
                  <h3>${escapeHtml(method.label)}</h3>
                  <p>${escapeHtml(method.method)}</p>
                </article>
              `).join('') || '<p class="comparison-no-result">Method details appear with connected data.</p>'}
            </div>
          </section>

          <section class="dossier-card provenance-range-card">
            <div class="dossier-card-header">
              <span class="dossier-card-title">COMPARISON COVERAGE</span>
              <span class="dossier-card-sub">OFFICIAL TIME WINDOWS</span>
            </div>
            <div class="provenance-range-list">
              ${ranges.map(([range, snapshot]) => `
                <div>
                  <span>${escapeHtml(SPOTIFY_TIME_RANGES[range]?.label || range)}</span>
                  <strong>${snapshot.tracks?.length || 0} tracks / ${snapshot.artists?.length || 0} artists</strong>
                  <small>${snapshot.status?.tracks === 'available' && snapshot.status?.artists === 'available' ? 'Both lists available' : 'Partial or unavailable'}</small>
                </div>
              `).join('') || '<p class="comparison-no-result">Comparison windows are available after Spotify connects.</p>'}
            </div>
          </section>
        </div>

        <section class="provenance-limitations">
          <div>
            <span class="provenance-limit-index">01</span>
            <p>Top items are Spotify affinity rankings. They are not exact play counts or a complete listening log.</p>
          </div>
          <div>
            <span class="provenance-limit-index">02</span>
            <p>The long-term window is approximately one year, not lifetime history. Four-week and six-month windows are also approximate.</p>
          </div>
          <div>
            <span class="provenance-limit-index">03</span>
            <p>Recent-play timing uses only the latest 50 returned plays, so circadian views are a snapshot rather than a full-period census.</p>
          </div>
          <div>
            <span class="provenance-limit-index">04</span>
            <p>Soulseekr does not store listening history on a server. Access and refresh tokens remain in this browser.</p>
          </div>
          <div>
            <span class="provenance-limit-index">05</span>
            <p>Spotify artist genre tags are deprecated and may be empty. When absent, Soulseekr shows ranked artists instead of assigning speculative genres.</p>
          </div>
        </section>

        <div class="provenance-footer-note">
          <span>Granted scopes: ${provenance.scopes?.length ? provenance.scopes.map(scope => escapeHtml(scope)).join(', ') : 'none in sample mode'}</span>
          <a href="https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks" target="_blank" rel="noreferrer">Read Spotify's top-items reference</a>
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
          <h2 class="dossier-view-title">Average release year: <b>${a.tasteAge}</b></h2>
          <p class="dossier-view-sub">Release years from the ranked tracks in this Spotify window, grouped by decade.</p>
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
              ${a.oldestTrack?.track?.album?.images?.[0]?.url
                ? `<img src="${escapeHtml(a.oldestTrack.track.album.images[0].url)}" class="dossier-relic-art" alt="Album cover">`
                : ''}
              <div>
                <h3 class="dossier-relic-title">${escapeHtml(a.oldestTrack?.track?.name || '')}</h3>
                <p class="dossier-relic-artist">${escapeHtml(Array.isArray(a.oldestTrack?.track?.artists) ? a.oldestTrack.track.artists.map(art => (art && typeof art === 'object' ? art.name : art) || '').filter(Boolean).join(', ') : (a.oldestTrack?.track?.artistName || ''))}</p>
                <span class="dossier-relic-year">RELEASED: ${a.oldestTrack?.year || ''}</span>
              </div>
            </div>
          </div>

          <div class="dossier-card dossier-relic-card">
            <span class="dossier-relic-tag">THE MODERN VANGUARD (NEWEST DISCOVERY)</span>
            <div class="dossier-relic-body">
              ${a.newestTrack?.track?.album?.images?.[0]?.url
                ? `<img src="${escapeHtml(a.newestTrack.track.album.images[0].url)}" class="dossier-relic-art" alt="Album cover">`
                : ''}
              <div>
                <h3 class="dossier-relic-title">${escapeHtml(a.newestTrack?.track?.name || '')}</h3>
                <p class="dossier-relic-artist">${escapeHtml(Array.isArray(a.newestTrack?.track?.artists) ? a.newestTrack.track.artists.map(art => (art && typeof art === 'object' ? art.name : art) || '').filter(Boolean).join(', ') : (a.newestTrack?.track?.artistName || ''))}</p>
                <span class="dossier-relic-year">RELEASED: ${a.newestTrack?.year || ''}</span>
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
          <p class="dossier-view-sub">Among the recent plays returned by Spotify, the most represented hour is <b>${a.peakHour}</b>; <b>${a.nocturnalPct}%</b> of this limited sample occurred between 22:00 and 05:00.</p>
        </div>

        <div class="dossier-card dossier-circadian-wheel-card">
          <div class="dossier-circadian-dial-container">
            <div class="dossier-dial-center">
              <span class="dossier-dial-icon">🌙</span>
              <span class="dossier-dial-hour">${a.peakHour}</span>
              <span class="dossier-dial-label">MOST RECENT PLAYS</span>
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
          <p class="dossier-view-sub">Your ranked artists produce a rarity index of <b>${a.obscurityScore}</b> out of 100. Higher values indicate lower average Spotify artist popularity in this set.</p>
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
              ${a.mainstreamStaple ? '' : '<p class="dossier-gem-genres">No popularity field returned.</p>'}
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
          <p class="dossier-view-sub">An imagined three-day bill composed from your top streaming rotations.</p>
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
            <div class="fest-legal">IMAGINED FESTIVAL STUDY • NOT A REAL EVENT • DERIVED FROM CATALOG METADATA</div>
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
    this.modal.querySelector('#btn-retry-weather')?.addEventListener('click', () => {
      this.weatherData = null;
      this.loadWeather();
      this.render();
      this.modal.querySelector('[data-dept="weather"]')?.focus({ preventScroll: true });
    });
    this.modal.querySelector('#btn-retry-comparisons')?.addEventListener('click', () => {
      this.loadComparisons();
      this.render();
      this.modal.querySelector('.dossier-dept-btn.active')?.focus({ preventScroll: true });
    });

    // Close buttons
    const btnClose = this.modal.querySelector('#btn-dossier-close');
    if (btnClose) btnClose.onclick = () => this.close();

    const backdrop = this.modal.querySelector('#dossier-backdrop');
    if (backdrop) backdrop.onclick = () => this.close();

    // 1. Department Navigation Tabs
    const deptBtns = this.modal.querySelectorAll('.dossier-dept-btn');
    deptBtns.forEach((btn, index) => {
      btn.onclick = () => {
        const dept = btn.getAttribute('data-dept');
        if (dept) {
          if (dept !== this.activeDept && this.activeDept === 'audiodna' && this.activeSub.audiodna === 'explorer') {
            audioDna.destroy();
          }
          this.activeDept = dept;
          const prevId = this.spotlightTrack?.id;
          const wasPlaying = soundEngine.isPlaying && soundEngine.currentTrackId === prevId;
          this.spotlightTrack = this.pickRandomSpotlightTrack(prevId);
          if (wasPlaying && this.spotlightTrack) {
            soundEngine.playTrack(this.spotlightTrack);
          }
          this.render();
        }
      };
      btn.onkeydown = event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + deptBtns.length) % deptBtns.length;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % deptBtns.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = deptBtns.length - 1;
        const nextDept = deptBtns[nextIndex].getAttribute('data-dept');
        if (!nextDept) return;
        if (this.activeDept === 'audiodna' && this.activeSub.audiodna === 'explorer') {
          audioDna.destroy();
        }
        this.activeDept = nextDept;
        const prevId = this.spotlightTrack?.id;
        const wasPlaying = soundEngine.isPlaying && soundEngine.currentTrackId === prevId;
        this.spotlightTrack = this.pickRandomSpotlightTrack(prevId);
        if (wasPlaying && this.spotlightTrack) {
          soundEngine.playTrack(this.spotlightTrack);
        }
        this.render();
        requestAnimationFrame(() => {
          this.modal.querySelector(`.dossier-dept-btn[data-dept="${nextDept}"]`)?.focus();
        });
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

    const comparisonSelects = this.modal.querySelectorAll('[data-comparison-side]');
    comparisonSelects.forEach(select => {
      select.onchange = () => {
        const side = select.getAttribute('data-comparison-side');
        const nextRange = select.value;
        if (!SPOTIFY_TIME_RANGES[nextRange]) return;
        if (side === 'left') this.comparisonLeft = nextRange;
        if (side === 'right') this.comparisonRight = nextRange;
        this.render();
        requestAnimationFrame(() => {
          this.modal.querySelector(`[data-comparison-side="${side}"]`)?.focus();
        });
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
      const playTrack = (e) => {
        e.stopPropagation();
        const trId = el.getAttribute('data-track-id');
        const tr = this.data?.topTracks?.find(t => t.id === trId);
        if (tr) {
          if (soundEngine.currentTrackId === trId) {
            if (soundEngine.isPlaying) {
              soundEngine.pause();
            } else if (soundEngine.isPaused) {
              soundEngine.resume();
            } else {
              soundEngine.playTrack(tr);
            }
          } else {
            soundEngine.playTrack(tr);
            showToast(`Playing preview: ${tr.name}`, 'info', 2200);
          }
        }
      };
      const tr = this.data?.topTracks?.find(t => t.id === el.getAttribute('data-track-id'));
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', tr ? `Play preview for ${tr.name}` : 'Play track preview');
      el.onclick = playTrack;
      el.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playTrack(e);
        }
      };
    });

    // 8. Spotlight Bar Shuffle Button
    const btnShuffle = this.modal.querySelector('#btn-dossier-shuffle-track');
    if (btnShuffle) {
      btnShuffle.onclick = (e) => {
        e.stopPropagation();
        const prevId = this.spotlightTrack?.id;
        const wasPlaying = soundEngine.isPlaying && soundEngine.currentTrackId === prevId;
        this.spotlightTrack = this.pickRandomSpotlightTrack(prevId);
        if (wasPlaying && this.spotlightTrack) {
          soundEngine.playTrack(this.spotlightTrack);
        }
        this.render();
      };
    }

    // 9. General Export Poster Button
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

  updatePlaybackUi(ps = {}) {
    if (!this.modal || !this.isOpen) return;
    const triggers = this.modal.querySelectorAll('.track-play-trigger');
    triggers.forEach(el => {
      const trId = el.getAttribute('data-track-id');
      const isCurrent = trId === ps.currentTrackId;
      const isPlaying = isCurrent && ps.isPlaying;
      const isPaused = isCurrent && ps.isPaused;
      const isLoading = isCurrent && ps.isLoading;
      el.classList.toggle('active', isCurrent && (isPlaying || isPaused || isLoading));
      el.classList.toggle('is-playing', isPlaying);
      el.classList.toggle('is-paused', isPaused);
      const playBtn = el.querySelector('.dossier-btn-play');
      if (playBtn) {
        if (isLoading) {
          playBtn.textContent = '…';
          playBtn.title = 'Loading audio preview';
        } else if (isPlaying) {
          playBtn.textContent = '❚❚';
          playBtn.title = 'Pause audio preview';
        } else if (isPaused) {
          playBtn.textContent = '▶';
          playBtn.title = 'Resume audio preview';
        } else {
          playBtn.textContent = '▶';
          playBtn.title = 'Play audio preview';
        }
      }

      const spotlightPlayText = el.querySelector('.spotlight-play-text');
      const indicator = el.querySelector('.track-indicator');
      if (indicator) {
        if (isCurrent && isLoading) {
          indicator.className = 'track-indicator mini-spinner';
          indicator.innerHTML = '';
          if (spotlightPlayText) spotlightPlayText.textContent = 'Loading';
        } else if (isCurrent && isPlaying) {
          indicator.className = 'track-indicator mini-eq';
          indicator.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
          if (spotlightPlayText) spotlightPlayText.textContent = 'Pause';
        } else if (isCurrent && isPaused) {
          indicator.className = 'track-indicator play-hint play-hint-paused';
          indicator.innerHTML = '▶';
          if (spotlightPlayText) spotlightPlayText.textContent = 'Resume';
        } else {
          indicator.className = 'track-indicator play-hint';
          indicator.innerHTML = '▶';
          if (spotlightPlayText) spotlightPlayText.textContent = 'Play';
        }
      }
    });
  }
}

export const sonicDossier = new SonicDossierEngine();
