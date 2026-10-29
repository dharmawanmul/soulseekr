/**
 * Soulseekr Main Application Orchestrator
 * Physical Music Artifacts with 3D Tilt & Studio Audio
 */

import { 
  initiateSpotifyLogin, 
  handleAuthCallback, 
  getValidAccessToken, 
  fetchCompleteUserWrapped, 
  logoutSpotify,
  SPOTIFY_TIME_RANGES
} from './spotify-api.js';
import { 
  renderVinylCard, 
  renderSwissCard, 
  renderPrismCard, 
  renderCassetteCard, 
  renderReceiptCard,
  renderDapCard,
  renderGameboyCard,
  renderVipPassCard,
  getIndicator,
  formatDuration
} from './card-renderer.js';
import { soundEngine } from './audio-player.js';
import { exportCardAsImage, downloadDataUrl, copyCardToClipboard } from './exporter.js';
import { wrappedExperience } from './wrapped-experience.js';
import { sonicDossier } from './dossier.js';

const SESSION_KEYS = {
  mode: 'soulseekr_mode',
  cardStyle: 'soulseekr_card_style',
  timeRange: 'soulseekr_time_range'
};

const VALID_CARD_STYLES = new Set(['vinyl', 'swiss', 'prism', 'cassette', 'receipt', 'dap', 'gameboy', 'vippass']);
const VALID_TIME_RANGES = new Set(['short_term', 'medium_term', 'long_term']);

function readSessionValue(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // The studio still works when private browsing blocks session storage.
  }
}

// Curated default preview data allowing instant, responsive exploration across all 8 card archetypes
export const DEFAULT_CURATED_DATA = {
  provenance: { mode: 'sample', selectedRange: 'short_term' },
  user: {
    display_name: 'Soulseekr Archivist',
    images: []
  },
  timeRange: 'short_term',
  topTracks: [
    {
      id: 'preview_radiohead_1',
      name: 'Everything In Its Right Place',
      artists: [{ name: 'Radiohead', id: 'art_radiohead' }],
      album: {
        name: 'Kid A',
        release_date: '2000-10-02',
        images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 251426,
      popularity: 76,
      preview_url: null
    },
    {
      id: 'preview_1',
      name: 'Starboy',
      artists: [{ name: 'The Weeknd', id: 'art_1' }, { name: 'Daft Punk', id: 'art_2' }],
      album: {
        name: 'Starboy',
        release_date: '2016-11-25',
        images: [{ url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 230453,
      popularity: 94,
      preview_url: null
    },
    {
      id: 'preview_2',
      name: 'Midnight City',
      artists: [{ name: 'M83', id: 'art_3' }],
      album: {
        name: "Hurry Up, We're Dreaming",
        release_date: '2011-10-18',
        images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 243266,
      popularity: 76,
      preview_url: null
    },
    {
      id: 'preview_3',
      name: 'The Less I Know The Better',
      artists: [{ name: 'Tame Impala', id: 'art_4' }],
      album: {
        name: 'Currents',
        release_date: '2015-07-17',
        images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 216320,
      popularity: 84,
      preview_url: null
    },
    {
      id: 'preview_4',
      name: '505',
      artists: [{ name: 'Arctic Monkeys', id: 'art_5' }],
      album: {
        name: 'Favourite Worst Nightmare',
        release_date: '2007-04-23',
        images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 253586,
      popularity: 88,
      preview_url: null
    },
    {
      id: 'preview_5',
      name: 'Dreams',
      artists: [{ name: 'Fleetwood Mac', id: 'art_6' }],
      album: {
        name: 'Rumours',
        release_date: '1977-02-04',
        images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 257800,
      popularity: 82,
      preview_url: null
    }
  ],
  topArtists: [
    { name: 'Radiohead', popularity: 78, genres: ['alternative rock', 'art rock', 'electronic'], images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'The Weeknd', popularity: 95, genres: ['canadian pop', 'r&b'], images: [{ url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'M83', popularity: 72, genres: ['indie rock', 'synthpop', 'french touch'], images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Tame Impala', popularity: 84, genres: ['neo-psychedelia', 'aussie psych'], images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Arctic Monkeys', popularity: 88, genres: ['garage rock', 'indie rock', 'uk post-punk'], images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Fleetwood Mac', popularity: 82, genres: ['classic rock', 'soft rock'], images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'The Japanese House', popularity: 38, genres: ['indie pop', 'synthwave'], images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Boy Harsher', popularity: 44, genres: ['darkwave', 'electronic body music'], images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Beach House', popularity: 71, genres: ['dream pop', 'shoegaze'], images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Men I Trust', popularity: 58, genres: ['canadian indie', 'bedroom pop'], images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Alvvays', popularity: 62, genres: ['jangle pop', 'indie rock'], images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Slowdive', popularity: 64, genres: ['shoegaze', 'ethereal wave'], images: [{ url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Yves Tumor', popularity: 52, genres: ['experimental rock', 'glam rock'], images: [{ url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80' }] }
  ],
  topAlbums: [
    {
      id: 'alb_1',
      name: 'Starboy',
      artistName: 'The Weeknd',
      releaseYear: '2016',
      trackCount: 4,
      images: [{ url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=500&q=80' }]
    },
    {
      id: 'alb_2',
      name: "Hurry Up, We're Dreaming",
      artistName: 'M83',
      releaseYear: '2011',
      trackCount: 3,
      images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=80' }]
    },
    {
      id: 'alb_3',
      name: 'Currents',
      artistName: 'Tame Impala',
      releaseYear: '2015',
      trackCount: 3,
      images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80' }]
    },
    {
      id: 'alb_4',
      name: 'Favourite Worst Nightmare',
      artistName: 'Arctic Monkeys',
      releaseYear: '2007',
      trackCount: 2,
      images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=500&q=80' }]
    },
    {
      id: 'alb_5',
      name: 'Rumours',
      artistName: 'Fleetwood Mac',
      releaseYear: '1977',
      trackCount: 2,
      images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=80' }]
    }
  ],
  topGenres: [
    { name: 'Alternative Rock', count: 12, percentage: 38 },
    { name: 'Neo-Psychedelia', count: 9, percentage: 24 },
    { name: 'Synthpop & Wave', count: 6, percentage: 19 },
    { name: 'Indie Rock', count: 5, percentage: 12 },
    { name: 'Classic Rock', count: 4, percentage: 7 }
  ],
  stats: {
    dominantGenre: 'Alternative Rock',
    topGenre: 'Alternative Rock',
    obscurityScore: 73,
    obscurityTier: 'Underground Crate Digger',
    rankedTrackMinutes: 24,
    acousticEnergy: '74%',
    energyScore: 78,
    danceScore: 72,
    acousticScore: 54,
    tempoBpm: 122,
    vibeLabel: 'Cinematic Dreamer',
    auraTitle: 'Subterranean Velvet',
    auraColors: ['#8b5cf6', '#38bdf8', '#c084fc']
  }
};

// Application State
const storedCardStyle = readSessionValue(SESSION_KEYS.cardStyle);
const storedTimeRange = readSessionValue(SESSION_KEYS.timeRange);

const state = {
  mode: readSessionValue(SESSION_KEYS.mode) === 'spotify' ? 'spotify' : 'sample',
  cardStyle: VALID_CARD_STYLES.has(storedCardStyle) ? storedCardStyle : 'vinyl',
  timeRange: VALID_TIME_RANGES.has(storedTimeRange) ? storedTimeRange : 'short_term',
  spotifyToken: null,
  cachedRealData: {},
  currentData: DEFAULT_CURATED_DATA,
  playbackState: {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    trackId: null
  }
};

// DOM References (Queried on DOM ready)
const elements = {};
let dataRequestId = 0;
let gatewayReturnFocus = null;

function initElements() {
  elements.cardContainer = document.getElementById('card-display-container');
  elements.cardTiltBox = document.getElementById('card-tilt-container');
  elements.specularGlare = document.getElementById('specular-glare');
  elements.cardStyleTabs = document.querySelectorAll('.seg-btn');
  elements.timeRangePills = document.querySelectorAll('.time-btn');
  elements.btnExportStory = document.getElementById('btn-export-story');
  elements.btnExportSquare = document.getElementById('btn-export-square');
  elements.btnExportPoster = document.getElementById('btn-export-poster');
  elements.btnCopyClip = document.getElementById('btn-copy-clip');
  elements.btnOpenWrapped = document.getElementById('btn-open-wrapped');
  elements.btnOpenDossier = document.getElementById('btn-open-dossier');
  elements.btnConnectSpotify = document.getElementById('btn-connect-spotify');
  elements.btnLogout = document.getElementById('btn-logout');
  elements.authStatusBadge = document.getElementById('auth-status-badge');
  elements.toastContainer = document.getElementById('toast-container');
  elements.nowPlayingBar = document.getElementById('now-playing-bar');
  elements.dockThumb = document.getElementById('dock-thumb');
  elements.npTrackName = document.getElementById('np-track-name');
  elements.npArtistName = document.getElementById('np-artist-name');
  elements.npToggleBtn = document.getElementById('np-toggle-btn');
  elements.npToggleIcon = document.getElementById('np-toggle-icon');
  elements.npStopBtn = document.getElementById('np-stop-btn');
  elements.demoModeIndicator = document.getElementById('demo-mode-indicator');
  elements.btnDemoStageConnect = document.getElementById('btn-demo-stage-connect');
  elements.authGatewayModal = document.getElementById('auth-gateway-modal');
  elements.authGatewayBackdrop = document.getElementById('auth-gateway-backdrop');
  elements.btnGatewayClose = document.getElementById('btn-gateway-close');
  elements.btnGatewayConnect = document.getElementById('btn-gateway-connect');
  elements.btnGatewayDemo = document.getElementById('btn-gateway-demo');
  elements.selectedEditionTitle = document.getElementById('selected-edition-title');
  elements.selectedEditionDescription = document.getElementById('selected-edition-description');
  elements.timeframeHelp = document.getElementById('timeframe-help');
  elements.stageStatus = document.getElementById('stage-status');
  elements.exportStatus = document.getElementById('export-status');
  elements.authGatewayStatus = document.getElementById('auth-gateway-status');
}

function updateEditionSummary(button) {
  if (!button) return;
  if (elements.selectedEditionTitle) {
    elements.selectedEditionTitle.textContent = button.textContent.trim();
  }
  if (elements.selectedEditionDescription) {
    elements.selectedEditionDescription.textContent = button.dataset.description || '';
  }
}

function persistWorkspace() {
  writeSessionValue(SESSION_KEYS.mode, state.mode);
  writeSessionValue(SESSION_KEYS.cardStyle, state.cardStyle);
  writeSessionValue(SESSION_KEYS.timeRange, state.timeRange);
}

function clearInlineStatus(container) {
  if (!container) return;
  container.hidden = true;
  container.replaceChildren();
  delete container.dataset.tone;
  container.setAttribute('role', 'status');
}

function showInlineStatus(container, { tone = 'info', title, message, actionLabel, onAction } = {}) {
  if (!container || !title || !message) return;

  const copy = document.createElement('div');
  copy.className = 'studio-inline-status-copy';

  const heading = document.createElement('strong');
  heading.className = 'studio-inline-status-title';
  heading.textContent = title;

  const description = document.createElement('p');
  description.textContent = message;

  copy.append(heading, description);
  container.replaceChildren(copy);

  if (actionLabel && typeof onAction === 'function') {
    const action = document.createElement('button');
    action.className = 'studio-inline-action';
    action.type = 'button';
    action.textContent = actionLabel;
    action.addEventListener('click', onAction, { once: true });
    container.appendChild(action);
  }

  container.dataset.tone = tone;
  container.setAttribute('role', tone === 'error' ? 'alert' : 'status');
  container.hidden = false;
}

function syncTimeframeControls() {
  const isConnected = Boolean(state.spotifyToken);
  if (!isConnected && state.timeRange !== 'short_term') {
    state.timeRange = 'short_term';
  }

  elements.timeRangePills?.forEach(pill => {
    const range = pill.dataset.range;
    const unavailable = !isConnected && range !== 'short_term';
    const active = range === state.timeRange;

    pill.disabled = unavailable;
    pill.setAttribute('aria-disabled', String(unavailable));
    pill.setAttribute('aria-checked', String(active));
    pill.classList.toggle('active', active);
    pill.tabIndex = active ? 0 : -1;

    if (unavailable) {
      const label = range === 'medium_term' ? '6-month' : 'approximate 1-year';
      pill.title = `Connect Spotify to use the ${label} window`;
    } else {
      pill.removeAttribute('title');
    }
  });

  if (elements.timeframeHelp) {
    elements.timeframeHelp.textContent = isConnected
      ? 'Choose 4 weeks, 6 months, or Spotify\'s approximate 1-year window.'
      : 'The sample archive uses 4 weeks. Connect Spotify for longer windows.';
  }
}

function syncEditionControls() {
  const selected = [...(elements.cardStyleTabs || [])].find(button => button.dataset.style === state.cardStyle)
    || elements.cardStyleTabs?.[0];
  if (!selected) return;

  elements.cardStyleTabs.forEach(button => {
    const active = button === selected;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  state.cardStyle = selected.dataset.style;
  updateEditionSummary(selected);
}

function enterSampleArchive({ announce = false, preserveStageStatus = false } = {}) {
  dataRequestId += 1;
  soundEngine.stop();
  state.mode = 'sample';
  state.spotifyToken = null;
  state.timeRange = 'short_term';
  state.currentData = DEFAULT_CURATED_DATA;
  if (!preserveStageStatus) clearInlineStatus(elements.stageStatus);
  if (elements.demoModeIndicator) elements.demoModeIndicator.style.display = 'inline-flex';
  updateAuthBadge('SAMPLE ARCHIVE', 'unauth');
  syncTimeframeControls();
  persistWorkspace();
  renderCurrentCard();
  hideAuthGateway();
  if (announce) {
    showToast('Sample archive ready. Connect Spotify when you want to use your own history.', 'info', 4000);
  }
}

function setButtonBusy(button, busy, label) {
  if (!button) return;
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
  if (label) button.dataset.busyLabel = label;
}

/**
 * Toast Notification System (Smooth Queue & Deduplication)
 */
export function showToast(message, type = 'info', duration = 2800) {
  const container = elements.toastContainer || document.getElementById('toast-container');
  if (!container) return;

  // Prevent duplicate notifications of the exact same message
  const existingToasts = container.querySelectorAll('.toast');
  for (const t of existingToasts) {
    if (t.textContent.trim() === message.trim()) {
      return;
    }
  }

  // When a terminal state toast (success or error) arrives, smoothly dismiss any previous loading toast
  if (type === 'success' || type === 'error') {
    existingToasts.forEach(t => {
      if (t.textContent.includes('Authenticating') || t.textContent.includes('Redirecting')) {
        t.classList.remove('toast-visible');
        setTimeout(() => t.remove(), 160);
      }
    });
  }

  // Keep at most 2 visible toasts at a time to prevent notification stacking
  if (existingToasts.length >= 2) {
    const oldest = existingToasts[0];
    oldest.classList.remove('toast-visible');
    setTimeout(() => oldest.remove(), 160);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const toastText = document.createElement('span');
  toastText.textContent = message;
  toast.appendChild(toastText);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/**
 * Update UI Data based on mode & range
 */
async function loadData() {
  const requestId = ++dataRequestId;
  const requestedRange = state.timeRange;
  const isCurrent = () => requestId === dataRequestId && requestedRange === state.timeRange;
  let token;
  try {
    token = state.spotifyToken || (await getValidAccessToken());
  } catch (error) {
    if (!isCurrent()) return;
    renderCurrentCard();
    showInlineStatus(elements.stageStatus, {
      tone: 'error', title: error.code === 'SPOTIFY_RATE_LIMITED' ? 'Spotify asked us to wait' : 'Spotify could not reconnect',
      message: error.code === 'SPOTIFY_RATE_LIMITED' ? error.message : 'Your saved connection is still available. Check your internet connection and try again.',
      actionLabel: 'Try again', onAction: loadData
    });
    return;
  }
  if (!isCurrent()) return;
  if (!token) {
    enterSampleArchive();
    return;
  }

  state.spotifyToken = token;
  state.mode = 'spotify';
  if (elements.demoModeIndicator) elements.demoModeIndicator.style.display = 'none';
  hideAuthGateway();
  updateAuthBadge('SPOTIFY CONNECTED', 'active');
  syncTimeframeControls();
  persistWorkspace();
  clearInlineStatus(elements.stageStatus);

  if (state.cachedRealData[requestedRange]) {
    state.currentData = state.cachedRealData[requestedRange];
    updateAuthBadge((state.currentData.user?.display_name || 'SPOTIFY CONNECTED').toUpperCase(), 'active');
    renderCurrentCard();
    return;
  }

  try {
    elements.cardContainer.innerHTML = `
      <div class="studio-state" role="status" aria-live="polite">
        <div class="loading-spinner"></div>
        <h3>Preparing your artifact</h3>
        <p>Reading your Spotify history for this listening window.</p>
      </div>
    `;
    const wrapped = await fetchCompleteUserWrapped(token, requestedRange);
    if (!isCurrent()) return;
    state.cachedRealData[requestedRange] = wrapped;
    state.currentData = wrapped;
    updateAuthBadge((wrapped.user?.display_name || 'SPOTIFY CONNECTED').toUpperCase(), 'active');
    renderCurrentCard();
  } catch (err) {
    if (!isCurrent()) return;
    console.error('Fetch wrapped error:', err);
    if (err.message && err.message.toLowerCase().includes('session expired')) {
      enterSampleArchive({ preserveStageStatus: true });
      showInlineStatus(elements.stageStatus, {
        tone: 'error',
        title: 'Your Spotify session ended',
        message: 'The sample archive is open, so you can keep exploring. Reconnect to use your listening history again.',
        actionLabel: 'Reconnect Spotify',
        onAction: showAuthGateway
      });
    } else {
      updateAuthBadge('SPOTIFY CONNECTED', 'active');
      state.currentData = state.currentData?.provenance?.mode === 'spotify' ? state.currentData : null;
      if (state.currentData?.provenance?.selectedRange) {
        state.timeRange = state.currentData.provenance.selectedRange;
        syncTimeframeControls();
        persistWorkspace();
      }
      renderCurrentCard();
      showInlineStatus(elements.stageStatus, {
        tone: 'error',
        title: err.code === 'SPOTIFY_RATE_LIMITED' ? 'Spotify asked us to wait' : 'Spotify could not refresh this window',
        message: err.code === 'SPOTIFY_RATE_LIMITED' ? err.message : state.currentData
          ? `Your ${SPOTIFY_TIME_RANGES[state.timeRange]?.label.toLowerCase() || 'previous'} archive is still shown. Retry to load ${SPOTIFY_TIME_RANGES[requestedRange]?.label.toLowerCase() || 'the requested window'}.`
          : 'No Spotify data was loaded. Check your connection and try again.',
        actionLabel: 'Try again',
        onAction: () => {
          state.timeRange = requestedRange;
          syncTimeframeControls();
          persistWorkspace();
          loadData();
        }
      });
    }
  }
}

export function showAuthGateway() {
  if (elements.authGatewayModal) {
    gatewayReturnFocus = document.activeElement;
    clearInlineStatus(elements.authGatewayStatus);
    elements.authGatewayModal.classList.add('is-open');
    elements.authGatewayModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      if (elements.authGatewayModal?.classList.contains('is-open')) {
        elements.btnGatewayConnect?.focus({ preventScroll: true });
      }
    }, 0);
  }
}

export function hideAuthGateway() {
  if (elements.authGatewayModal) {
    elements.authGatewayModal.classList.remove('is-open');
    elements.authGatewayModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (gatewayReturnFocus instanceof HTMLElement) gatewayReturnFocus.focus();
    gatewayReturnFocus = null;
  }
}

function handleGatewayKeydown(event) {
  if (!elements.authGatewayModal?.classList.contains('is-open')) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    enterSampleArchive();
    return;
  }

  if (event.key !== 'Tab') return;
  const focusable = [...elements.authGatewayModal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.disabled && element.getAttribute('aria-hidden') !== 'true');
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function updateAuthBadge(text, status) {
  elements.authStatusBadge.textContent = text;
  elements.authStatusBadge.className = `auth-badge badge-${status}`;
  if (status === 'active') {
    elements.authStatusBadge.disabled = true;
    elements.authStatusBadge.setAttribute('aria-label', 'Spotify connected');
    elements.btnLogout.style.display = 'inline-flex';
    elements.btnConnectSpotify.style.display = 'none';

    // Unlock Wrapped and Dossier buttons for authenticated users
    elements.btnOpenWrapped?.classList.remove('is-locked');
    elements.btnOpenWrapped?.setAttribute('title', 'Open your Year in Music');
    elements.btnOpenDossier?.classList.remove('is-locked');
    elements.btnOpenDossier?.setAttribute('title', 'Open your Sonic Taste Dossier & Audio DNA');
  } else {
    elements.authStatusBadge.disabled = false;
    elements.authStatusBadge.setAttribute('aria-label', 'Open Spotify connection options');
    elements.btnLogout.style.display = 'none';
    elements.btnConnectSpotify.style.display = 'inline-flex';

    // Lock Wrapped and Dossier buttons for unauthenticated users
    elements.btnOpenWrapped?.classList.add('is-locked');
    elements.btnOpenWrapped?.setAttribute('title', 'Connect Spotify to open your Year in Music');
    elements.btnOpenDossier?.classList.add('is-locked');
    elements.btnOpenDossier?.setAttribute('title', 'Connect Spotify to open your Taste Dossier');
  }
}

async function startSpotifyAuth() {
  clearInlineStatus(elements.authGatewayStatus);
  setButtonBusy(elements.btnGatewayConnect, true);
  showToast('Redirecting to Spotify...', 'info', 2000);
  try {
    await initiateSpotifyLogin();
    return true;
  } catch (err) {
    console.error('Spotify login error:', err);
    showInlineStatus(elements.authGatewayStatus, {
      tone: 'error',
      title: 'Spotify connection could not start',
      message: navigator.onLine
        ? 'Spotify did not accept the connection request. Check the configured redirect address and try again.'
        : 'This browser is offline. Reconnect to the internet, then try Spotify again.',
      actionLabel: 'Try Spotify again',
      onAction: startSpotifyAuth
    });
    return false;
  } finally {
    setButtonBusy(elements.btnGatewayConnect, false);
  }
}

/**
 * Render the currently selected physical card directly
 */
function renderCurrentCard() {
  const data = state.currentData;
  const renderedRange = data?.provenance?.selectedRange || state.timeRange;
  if (!data) {
    elements.cardContainer.innerHTML = `
      <div class="studio-state studio-state-connect" role="status">
        <span class="studio-state-index">Spotify data unavailable</span>
        <h3>This listening window could not be prepared.</h3>
        <p>Try the request again above, or return to the labelled sample archive.</p>
        <button class="btn-primary" type="button" id="btn-empty-sample">Open sample archive</button>
      </div>
    `;
    document.getElementById('btn-empty-sample')?.addEventListener('click', () => enterSampleArchive({ announce: true }));
    return;
  }
  if (!Array.isArray(data.topTracks) || data.topTracks.length === 0) {
    elements.cardContainer.innerHTML = `
      <div class="studio-state" role="status">
        <span class="studio-state-index">No listening data</span>
        <h3>This window has no tracks yet.</h3>
        <p>Choose another listening window or return after Spotify has more history to share.</p>
      </div>
    `;
    return;
  }
  let html = '';
  try {
    switch (state.cardStyle) {
      case 'vinyl':
        html = renderVinylCard(data, renderedRange, state.playbackState);
        break;
      case 'swiss':
        html = renderSwissCard(data, renderedRange, state.playbackState);
        break;
      case 'prism':
        html = renderPrismCard(data, renderedRange, state.playbackState);
        break;
      case 'cassette':
        html = renderCassetteCard(data, renderedRange, state.playbackState);
        break;
      case 'receipt':
        html = renderReceiptCard(data, renderedRange, state.playbackState);
        break;
      case 'dap':
        html = renderDapCard(data, renderedRange, state.playbackState);
        break;
      case 'gameboy':
        html = renderGameboyCard(data, renderedRange, state.playbackState);
        break;
      case 'vippass':
        html = renderVipPassCard(data, renderedRange, state.playbackState);
        break;
      default:
        html = renderReceiptCard(data, renderedRange, state.playbackState);
        break;
    }

    elements.cardContainer.innerHTML = html;
    attachTrackListeners();
  } catch (err) {
    console.error('Card rendering error:', err);
    elements.cardContainer.innerHTML = `
      <div class="studio-state studio-state-error" role="alert">
        <span class="studio-state-index">Render error</span>
        <h3>This edition could not be prepared.</h3>
        <p>A rendering issue occurred while preparing this card. You can try another format or reset to the sample archive.</p>
        <button class="btn-primary" type="button" id="btn-recovery-sample">Reset to sample archive</button>
      </div>
    `;
    document.getElementById('btn-recovery-sample')?.addEventListener('click', () => {
      enterSampleArchive({ announce: true });
    });
  }
}

/**
 * Surgically update track play/pause indicators and labels without rebuilding DOM
 */
function updateCardPlaybackUI() {
  const triggers = elements.cardContainer.querySelectorAll('.track-play-trigger');
  const ps = state.playbackState;
  const data = state.currentData;
  if (!triggers.length || !data) return;

  triggers.forEach(el => {
    const trackId = el.getAttribute('data-track-id');
    const track = data.topTracks?.find(t => t.id === trackId);
    const isActive = trackId === ps.trackId && (ps.isPlaying || ps.isPaused || ps.isLoading);
    el.classList.toggle('active', isActive);
    el.classList.toggle('playing', isActive);

    const action = isActive
      ? (ps.isPaused ? 'Resume' : ps.isLoading ? 'Cancel' : 'Pause')
      : 'Play';
    el.setAttribute('aria-label', track ? `${action} preview for ${track.name}` : 'Play track preview');

    const indicator = el.querySelector('.track-indicator, .mini-eq, .play-hint, .mini-spinner');
    if (indicator) {
      const temp = document.createElement('div');
      temp.innerHTML = getIndicator(trackId, ps);
      const nextIndicator = temp.firstElementChild;
      if (nextIndicator) {
        indicator.replaceWith(nextIndicator);
      }
    }

    const gbDur = el.querySelector('.gb-track-dur');
    if (gbDur && track) {
      gbDur.textContent = isActive
        ? (ps.isPaused ? '❚❚' : '▶▶')
        : formatDuration(track.duration_ms);
    }

    const dapRowRight = el.querySelector('.dap-row-right');
    if (dapRowRight && track) {
      dapRowRight.innerHTML = isActive
        ? `<span class="dap-playing-pulse">${ps.isPaused ? '❚❚ PAUSED' : '▶ PLAYING'}</span>`
        : `<span class="dap-row-time">${formatDuration(track.duration_ms)}</span>`;
    }
  });

  const spoolGears = elements.cardContainer.querySelectorAll('.spool-gear');
  spoolGears.forEach(gear => {
    gear.classList.toggle('spinning', Boolean(ps.isPlaying));
  });
}

/**
 * Attach click listeners to all tracks inside card
 */
function attachTrackListeners() {
  const triggerElements = elements.cardContainer.querySelectorAll('.track-play-trigger');
  const data = state.currentData;
  if (!data) return;
  triggerElements.forEach(el => {
    const activateTrack = async () => {
      const trackId = el.getAttribute('data-track-id');
      const track = data.topTracks.find(t => t.id === trackId);
      if (track) {
        await soundEngine.playTrack(track);
      }
    };
    const trackId = el.getAttribute('data-track-id');
    const track = data.topTracks.find(t => t.id === trackId);
    const isCurrentTrack = trackId === state.playbackState.trackId;
    const action = isCurrentTrack
      ? (state.playbackState.isPaused ? 'Resume' : state.playbackState.isLoading ? 'Cancel' : 'Pause')
      : 'Play';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', track ? `${action} preview for ${track.name}` : 'Play track preview');
    el.addEventListener('click', activateTrack);
    el.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateTrack();
      }
    });
  });
}

/**
 * Setup Sound Engine Notifications & Dynamic Island updates
 */
soundEngine.onStateChange(({ isPlaying, isPaused, isLoading, currentTrackId, currentTrack, previewError }) => {
  if (previewError) showToast(previewError, 'info', 5000);
  state.playbackState = { isPlaying, isPaused, isLoading, trackId: currentTrackId };
  const data = state.currentData;

  if ((isPlaying || isPaused || isLoading) && currentTrackId && data) {
    const track = currentTrack || data.topTracks.find(t => t.id === currentTrackId);
    if (track) {
      elements.nowPlayingBar.classList.add('active');
      elements.nowPlayingBar.classList.toggle('is-paused', isPaused);
      elements.nowPlayingBar.classList.toggle('is-loading', isLoading);
      elements.npTrackName.textContent = track.name;
      elements.npArtistName.textContent = Array.isArray(track.artists)
        ? track.artists.map(a => (a && typeof a === 'object' ? a.name : a) || '').filter(Boolean).join(', ')
        : (track.artistName || 'Unknown Artist');
      
      const imgUrl = (track.album && track.album.images && track.album.images[0]?.url) || '';
      if (imgUrl) {
        elements.dockThumb.hidden = false;
        elements.dockThumb.src = imgUrl;
      } else {
        elements.dockThumb.removeAttribute('src');
        elements.dockThumb.hidden = true;
      }

      if (elements.npToggleBtn && elements.npToggleIcon) {
        elements.npToggleBtn.disabled = isLoading;
        elements.npToggleIcon.textContent = isLoading ? '…' : isPaused ? '▶' : 'Ⅱ';
        const action = isLoading ? 'Loading audio preview' : `${isPaused ? 'Resume' : 'Pause'} audio preview`;
        elements.npToggleBtn.title = action;
        elements.npToggleBtn.setAttribute('aria-label', action);
      }

      if (isPlaying) {
        showToast(track.source === 'generated' ? 'Playing local instrumental' : `Playing preview: ${track.name}`, 'info', 2000);
      }
    }
  } else if (!isPlaying && !isPaused && !isLoading) {
    elements.nowPlayingBar.classList.remove('active');
    elements.nowPlayingBar.classList.remove('is-paused', 'is-loading');
    elements.npTrackName.textContent = '';
    elements.npArtistName.textContent = '';
    elements.dockThumb.removeAttribute('src');
    elements.dockThumb.hidden = true;
  }

  updateCardPlaybackUI();
});

// Live Web Audio API frame listener: drives authentic real-time visualizers
soundEngine.onAudioFrame((frame) => {
  // 1. Update Now Playing dock micro-equalizer bars
  const dockEq = elements.nowPlayingBar?.querySelector('.mini-eq');
  if (dockEq) {
    if (frame.isResting) {
      dockEq.classList.remove('is-live');
    } else {
      dockEq.classList.add('is-live');
      const bars = dockEq.querySelectorAll('.bar');
      if (bars.length >= 3) {
        bars[0].style.height = `${Math.max(15, Math.min(100, Math.round(frame.bass * 100)))}%`;
        bars[1].style.height = `${Math.max(20, Math.min(100, Math.round(frame.mid * 100)))}%`;
        bars[2].style.height = `${Math.max(15, Math.min(100, Math.round(frame.treble * 100)))}%`;
      }
    }
  }

  // Also update active card and dossier track micro-equalizer bars if live
  const activeEqs = document.querySelectorAll('#card-display-container .track-play-trigger.active .mini-eq, #card-display-container .track-play-trigger.playing .mini-eq, #dossier-modal .track-play-trigger.active .mini-eq, #dossier-modal .track-play-trigger.playing .mini-eq');
  activeEqs.forEach(cardEq => {
    if (frame.isResting) {
      cardEq.classList.remove('is-live');
    } else {
      cardEq.classList.add('is-live');
      const bars = cardEq.querySelectorAll('.bar');
      if (bars.length >= 3) {
        bars[0].style.height = `${Math.max(15, Math.min(100, Math.round(frame.bass * 100)))}%`;
        bars[1].style.height = `${Math.max(20, Math.min(100, Math.round(frame.mid * 100)))}%`;
        bars[2].style.height = `${Math.max(15, Math.min(100, Math.round(frame.treble * 100)))}%`;
      }
    }
  });

  // 2. Update Titanium DAP Card stereo VU meters and measured specs
  const vuL = document.querySelector('.card-dap .dap-vu-l');
  const vuR = document.querySelector('.card-dap .dap-vu-r');
  if (vuL && vuR) {
    if (frame.isResting) {
      vuL.classList.remove('is-live');
      vuR.classList.remove('is-live');
    } else {
      vuL.classList.add('is-live');
      vuR.classList.add('is-live');
      const leftLevel = Math.max(8, Math.min(98, Math.round(frame.bass * 100)));
      const rightLevel = Math.max(8, Math.min(98, Math.round((frame.mid * 0.7 + frame.treble * 0.3) * 100)));
      vuL.style.width = `${leftLevel}%`;
      vuR.style.width = `${rightLevel}%`;
    }
  }

  const specsEl = document.querySelector('.card-dap .dap-audio-specs');
  if (frame.bpm && soundEngine.currentTrackId === state.currentData?.topTracks?.[0]?.id) {
    if (specsEl && specsEl.dataset.measuredBpm !== String(frame.bpm)) {
      specsEl.dataset.measuredBpm = String(frame.bpm);
      specsEl.innerHTML = `<span>ESTIMATED PREVIEW TEMPO</span><span>•</span><span>${frame.bpm} BPM</span>`;
    }
  } else if (specsEl?.dataset.measuredBpm) {
    delete specsEl.dataset.measuredBpm;
    specsEl.textContent = 'SPOTIFY CATALOG METADATA';
  }
});

/**
 * Motion-Primitives: Interactive 3D Card Tilt & Specular Glare
 */
function init3DCardTilt() {
  const box = elements.cardTiltBox;
  if (!box) return;

  const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const isReducedMotion = () => Boolean(motionQuery && motionQuery.matches);

  const resetTilt = () => {
    box.style.transition = 'transform 400ms cubic-bezier(0.23, 1, 0.32, 1)';
    box.style.transform = 'rotateX(0deg) rotateY(0deg)';
    box.style.setProperty('--glare-x', '50%');
    box.style.setProperty('--glare-y', '50%');
  };

  motionQuery?.addEventListener?.('change', () => {
    if (isReducedMotion()) {
      box.style.transition = 'none';
      box.style.transform = 'none';
    }
  });

  box.addEventListener('mousemove', (e) => {
    if (isReducedMotion()) return;

    const rect = box.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9; // max 9 deg
    const rotateY = ((x - centerX) / centerX) * 9;

    // Disable transition during active tracking for zero-lag feel
    box.style.transition = 'none';
    box.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    box.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
    box.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
  });

  box.addEventListener('mouseleave', () => {
    if (isReducedMotion()) {
      box.style.transform = 'none';
      return;
    }
    resetTilt();
  });
}

function triggerLockedButtonFeedback(button, message) {
  if (button) {
    button.classList.remove('is-shaking');
    void button.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe shake
    button.classList.add('is-shaking');
    setTimeout(() => {
      button?.classList.remove('is-shaking');
    }, 400);
  }
  showToast(message, 'warning', 3500);
  showAuthGateway();
}

async function runImageExport(button, format, filename, successTitle) {
  clearInlineStatus(elements.exportStatus);
  setButtonBusy(button, true);
  try {
    const dataUrl = await exportCardAsImage(format);
    downloadDataUrl(dataUrl, filename);
    showInlineStatus(elements.exportStatus, {
      tone: 'success',
      title: successTitle,
      message: `Saved as ${filename}.`
    });
  } catch (err) {
    console.error(`Export ${format} error:`, err);
    showInlineStatus(elements.exportStatus, {
      tone: 'error',
      title: `${successTitle.replace(' downloaded', '')} could not be created`,
      message: 'The artifact is still here. Wait for its artwork to finish loading, then try the export again.',
      actionLabel: 'Try export again',
      onAction: () => runImageExport(button, format, filename, successTitle)
    });
  } finally {
    setButtonBusy(button, false);
  }
}

async function runClipboardExport() {
  clearInlineStatus(elements.exportStatus);
  setButtonBusy(elements.btnCopyClip, true);
  try {
    await copyCardToClipboard();
    showInlineStatus(elements.exportStatus, {
      tone: 'success',
      title: 'Artifact copied',
      message: 'The selected edition is ready to paste into another app.'
    });
  } catch (err) {
    console.error('Clipboard export error:', err);
    showInlineStatus(elements.exportStatus, {
      tone: 'error',
      title: 'This browser could not copy the image',
      message: 'Download the square image instead. It contains the same selected artifact.',
      actionLabel: 'Download square image',
      onAction: () => elements.btnExportSquare?.click()
    });
  } finally {
    setButtonBusy(elements.btnCopyClip, false);
  }
}

async function getConnectedArchive(button, feature) {
  const requestId = dataRequestId;
  try {
    const token = state.spotifyToken || (await getValidAccessToken());
    if (requestId !== dataRequestId) return null;
    if (!token) {
      triggerLockedButtonFeedback(button, `Connect Spotify to open ${feature}`);
      return null;
    }
    state.spotifyToken = token;
    if (state.currentData?.provenance?.mode !== 'spotify') {
      showInlineStatus(elements.stageStatus, {
        tone: 'error', title: 'Your Spotify history is not ready',
        message: 'Wait for your history to finish loading, or retry the request. The sample archive has not been used as your account history.',
        actionLabel: 'Load Spotify history', onAction: loadData
      });
      return null;
    }
    return state.currentData;
  } catch (error) {
    if (requestId !== dataRequestId) return null;
    showInlineStatus(elements.stageStatus, {
      tone: 'error', title: 'Spotify could not reconnect',
      message: error.code === 'SPOTIFY_RATE_LIMITED' ? error.message
        : 'Your saved connection is still available. Check your connection and try again.',
      actionLabel: 'Try again', onAction: () => button?.click()
    });
    return null;
  }
}

function setupEventListeners() {
  elements.btnOpenWrapped?.addEventListener('click', async () => {
    const data = await getConnectedArchive(elements.btnOpenWrapped, 'your Year in Music');
    if (!data) return;
    if (!data?.topTracks?.length) {
      showToast('Spotify returned no ranked tracks for this window. Try another time horizon.', 'warning');
      return;
    }
    wrappedExperience.open(data, data.provenance?.selectedRange || state.timeRange);
  });

  elements.btnOpenDossier?.addEventListener('click', async () => {
    const data = await getConnectedArchive(elements.btnOpenDossier, 'your Taste Dossier');
    if (!data) return;
    if (!data?.topTracks?.length && !data?.topArtists?.length) {
      showToast('Spotify returned no listening data for this window. Try another time horizon.', 'warning');
      return;
    }
    sonicDossier.open(data, data.provenance?.selectedRange || state.timeRange);
  });

  elements.npStopBtn?.addEventListener('click', () => {
    soundEngine.stop();
  });

  elements.npToggleBtn?.addEventListener('click', () => {
    const track = soundEngine.currentTrack;
    if (track) soundEngine.playTrack(track);
  });

  elements.cardStyleTabs?.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.cardStyleTabs.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
        b.tabIndex = -1;
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      btn.tabIndex = 0;
      state.cardStyle = btn.getAttribute('data-style');
      updateEditionSummary(btn);
      persistWorkspace();
      clearInlineStatus(elements.exportStatus);
      renderCurrentCard();
    });
  });

  elements.cardStyleTabs?.forEach((btn, index) => {
    btn.addEventListener('keydown', event => {
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      if (!forward && !backward && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? elements.cardStyleTabs.length - 1
          : (index + (forward ? 1 : -1) + elements.cardStyleTabs.length) % elements.cardStyleTabs.length;
      const next = elements.cardStyleTabs[nextIndex];
      next.focus();
      next.click();
    });
  });

  elements.timeRangePills?.forEach(pill => {
    pill.addEventListener('click', () => {
      if (pill.disabled || pill.getAttribute('aria-disabled') === 'true') return;
      elements.timeRangePills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-checked', 'false');
        p.tabIndex = -1;
      });
      pill.classList.add('active');
      pill.setAttribute('aria-checked', 'true');
      pill.tabIndex = 0;
      state.timeRange = pill.getAttribute('data-range');
      persistWorkspace();
      clearInlineStatus(elements.stageStatus);
      loadData();
    });
  });

  elements.timeRangePills?.forEach(pill => {
    pill.addEventListener('keydown', event => {
      const isForward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const isBackward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
      if (!isForward && !isBackward && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const available = [...elements.timeRangePills].filter(option => !option.disabled);
      const currentIndex = available.indexOf(pill);
      const next = event.key === 'Home'
        ? available[0]
        : event.key === 'End'
          ? available[available.length - 1]
          : available[(currentIndex + (isForward ? 1 : -1) + available.length) % available.length];
      if (!next) return;
      next.focus();
      next.click();
    });
  });

  elements.btnExportStory?.addEventListener('click', () => {
    const filename = `soulseekr-${state.cardStyle}-story.png`;
    runImageExport(elements.btnExportStory, 'story', filename, 'Story image downloaded');
  });

  elements.btnExportSquare?.addEventListener('click', () => {
    const filename = `soulseekr-${state.cardStyle}-square.png`;
    runImageExport(elements.btnExportSquare, 'square', filename, 'Square image downloaded');
  });

  elements.btnExportPoster?.addEventListener('click', () => {
    const filename = `soulseekr-${state.cardStyle}-poster.png`;
    runImageExport(elements.btnExportPoster, 'poster', filename, 'Gallery print poster downloaded');
  });

  elements.btnCopyClip?.addEventListener('click', runClipboardExport);

  elements.btnConnectSpotify?.addEventListener('click', showAuthGateway);

  elements.btnGatewayConnect?.addEventListener('click', startSpotifyAuth);

  elements.btnGatewayDemo?.addEventListener('click', () => {
    enterSampleArchive({ announce: true });
  });

  elements.authGatewayBackdrop?.addEventListener('click', () => {
    enterSampleArchive();
  });

  elements.btnGatewayClose?.addEventListener('click', () => {
    enterSampleArchive();
  });

  elements.btnDemoStageConnect?.addEventListener('click', () => {
    showAuthGateway();
  });

  elements.authStatusBadge?.addEventListener('click', () => {
    if (!state.spotifyToken) {
      showAuthGateway();
    }
  });

  document.addEventListener('keydown', handleGatewayKeydown);

  elements.btnLogout?.addEventListener('click', () => {
    logoutSpotify();
    state.cachedRealData = {};
    enterSampleArchive();
    showToast('Spotify disconnected. The sample archive is open.', 'info');
  });
}

let isAppInitialized = false;

/**
 * Application Bootstrap
 */
async function initApp() {
  if (isAppInitialized) return;
  isAppInitialized = true;

  initElements();
  syncEditionControls();
  setupEventListeners();
  init3DCardTilt();

  const authParams = new URLSearchParams(window.location.search);
  const hasAuthCode = authParams.has('code') || authParams.has('error');
  if (hasAuthCode) {
    try {
      showToast('Authenticating with Spotify...', 'info', 3000);
      const token = await handleAuthCallback();
      if (token) {
        state.spotifyToken = token;
        state.mode = 'spotify';
        hideAuthGateway();
        updateAuthBadge('SPOTIFY CONNECTED', 'active');
        persistWorkspace();
        showToast('Spotify connected. Preparing your artifacts.', 'success');
      }
    } catch (err) {
      console.error('Auth error:', err);
      enterSampleArchive({ preserveStageStatus: true });
      showInlineStatus(elements.stageStatus, {
        tone: 'error',
        title: 'Spotify could not finish connecting',
        message: 'The sample archive is open. You can keep exploring and try the Spotify connection again.',
        actionLabel: 'Try Spotify again',
        onAction: showAuthGateway
      });
      return;
    }
  }

  await loadData();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
