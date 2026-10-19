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
  SPOTIFY_CONFIG 
} from './spotify-api.js';
import { 
  renderVinylCard, 
  renderSwissCard, 
  renderPrismCard, 
  renderCassetteCard, 
  renderReceiptCard,
  renderDapCard,
  renderGameboyCard,
  renderVipPassCard
} from './card-renderer.js';
import { soundEngine } from './audio-player.js';
import { exportCardAsImage, downloadDataUrl, copyCardToClipboard } from './exporter.js';
import { wrappedExperience } from './wrapped-experience.js';
import { sonicDossier } from './dossier.js';

// Curated default preview data allowing instant, responsive exploration across all 7 card archetypes
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
const state = {
  cardStyle: 'vinyl', // 'vinyl' | 'swiss' | 'prism' | 'cassette' | 'receipt' | 'gameboy' | 'vippass'
  timeRange: 'short_term', // 'short_term' | 'medium_term' | 'long_term'
  spotifyToken: null,
  cachedRealData: {},
  currentData: null,
  playbackState: {
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    trackId: null
  }
};

// DOM References (Queried on DOM ready)
const elements = {};
let gatewayReturnFocus = null;

function initElements() {
  elements.cardContainer = document.getElementById('card-display-container');
  elements.cardTiltBox = document.getElementById('card-tilt-container');
  elements.specularGlare = document.getElementById('specular-glare');
  elements.cardStyleTabs = document.querySelectorAll('.seg-btn');
  elements.timeRangePills = document.querySelectorAll('.time-btn');
  elements.btnExportStory = document.getElementById('btn-export-story');
  elements.btnExportSquare = document.getElementById('btn-export-square');
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
  const token = state.spotifyToken || (await getValidAccessToken());
  if (!token) {
    state.currentData = null;
    updateAuthBadge('CONNECT SPOTIFY', 'unauth');
    if (elements.demoModeIndicator) elements.demoModeIndicator.style.display = 'none';
    renderCurrentCard();
    checkAndShowAuthGateway();
    return;
  }

  // User is authenticated with genuine Spotify account
  state.spotifyToken = token;
  sessionStorage.setItem('soulseekr_auth_gateway_dismissed', 'true');
  if (elements.demoModeIndicator) elements.demoModeIndicator.style.display = 'none';
  hideAuthGateway();
  updateAuthBadge('SPOTIFY CONNECTED', 'active');

  if (state.cachedRealData[state.timeRange]) {
    state.currentData = state.cachedRealData[state.timeRange];
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
    const wrapped = await fetchCompleteUserWrapped(token, state.timeRange);
    state.cachedRealData[state.timeRange] = wrapped;
    state.currentData = wrapped;
    updateAuthBadge((wrapped.user?.display_name || 'SPOTIFY CONNECTED').toUpperCase(), 'active');
    renderCurrentCard();
  } catch (err) {
    console.error('Fetch wrapped error:', err);
    // Only demote session to unauth if token was genuinely expired/invalidated
    if (err.message && err.message.toLowerCase().includes('session expired')) {
      state.spotifyToken = null;
      updateAuthBadge('CONNECT SPOTIFY', 'unauth');
      if (elements.demoModeIndicator) elements.demoModeIndicator.style.display = 'none';
      showToast('Spotify session expired. Please reconnect.', 'error', 4500);
    } else {
      // Non-auth error: keep authenticated state in UI
      updateAuthBadge('SPOTIFY CONNECTED', 'active');
      showToast(`Spotify could not refresh this view: ${err.message}. Showing the last available archive.`, 'warning', 5000);
    }
    state.currentData = state.currentData?.provenance?.mode === 'spotify' ? state.currentData : null;
    renderCurrentCard();
  }
}

export function checkAndShowAuthGateway() {
  const isDismissed = sessionStorage.getItem('soulseekr_auth_gateway_dismissed');
  const storedToken = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.token);
  if (!isDismissed && !state.spotifyToken && !storedToken) {
    showAuthGateway();
  }
}

export function showAuthGateway() {
  if (elements.authGatewayModal) {
    gatewayReturnFocus = document.activeElement;
    elements.authGatewayModal.classList.add('is-open');
    elements.authGatewayModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => elements.btnGatewayConnect?.focus());
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
    sessionStorage.setItem('soulseekr_auth_gateway_dismissed', 'true');
    hideAuthGateway();
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
    elements.btnOpenWrapped?.setAttribute('title', 'Open your personal 3D Wrapped Experience');
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
  showToast('Redirecting to Spotify...', 'info', 2000);
  try {
    await initiateSpotifyLogin();
  } catch (err) {
    console.error('Spotify login error:', err);
    showToast(err.message, 'error', 4500);
  }
}

/**
 * Render the currently selected physical card directly
 */
function renderCurrentCard() {
  const data = state.currentData;
  if (!data) {
    elements.cardContainer.innerHTML = `
      <div class="studio-state studio-state-connect" role="status">
        <span class="studio-state-index">Your archive is private</span>
        <h3>Connect Spotify to build this artifact.</h3>
        <p>No sample listener or invented statistics are shown here.</p>
        <button class="btn-primary" type="button" id="btn-empty-connect">Connect Spotify</button>
      </div>
    `;
    document.getElementById('btn-empty-connect')?.addEventListener('click', startSpotifyAuth);
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

  switch (state.cardStyle) {
    case 'vinyl':
      html = renderVinylCard(data, state.timeRange, state.playbackState);
      break;
    case 'swiss':
      html = renderSwissCard(data, state.timeRange, state.playbackState);
      break;
    case 'prism':
      html = renderPrismCard(data, state.timeRange, state.playbackState);
      break;
    case 'cassette':
      html = renderCassetteCard(data, state.timeRange, state.playbackState);
      break;
    case 'receipt':
      html = renderReceiptCard(data, state.timeRange, state.playbackState);
      break;
    case 'dap':
    case 'gameboy':
      html = renderDapCard(data, state.timeRange, state.playbackState);
      break;
    case 'vippass':
      html = renderVipPassCard(data, state.timeRange, state.playbackState);
      break;
    default:
      html = renderReceiptCard(data, state.timeRange, state.playbackState);
      break;
  }

  elements.cardContainer.innerHTML = html;
  attachTrackListeners();
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
soundEngine.onStateChange(({ isPlaying, isPaused, isLoading, currentTrackId, currentTrack }) => {
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
        showToast(`Playing preview: ${track.name}`, 'info', 2000);
      }
    }
  } else if (!isPlaying && !isPaused && !isLoading) {
    elements.nowPlayingBar.classList.remove('active');
    elements.nowPlayingBar.classList.remove('is-paused', 'is-loading');
  }

  renderCurrentCard();
});



/**
 * Motion-Primitives: Interactive 3D Card Tilt & Specular Glare
 */
function init3DCardTilt() {
  const box = elements.cardTiltBox;
  if (!box) return;

  box.addEventListener('mousemove', (e) => {
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
    // Re-enable transition so the spring-back is smooth
    box.style.transition = 'transform 400ms cubic-bezier(0.23, 1, 0.32, 1)';
    box.style.transform = 'rotateX(0deg) rotateY(0deg)';
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

function setupEventListeners() {
  elements.btnOpenWrapped?.addEventListener('click', async () => {
    const token = state.spotifyToken || (await getValidAccessToken());
    if (!token) {
      triggerLockedButtonFeedback(elements.btnOpenWrapped, 'Connect Spotify to open your Year in Music');
      return;
    }
    state.spotifyToken = token;
    const data = state.currentData;
    if (!data?.topTracks?.length) {
      showToast('Spotify returned no ranked tracks for this window. Try another time horizon.', 'warning');
      return;
    }
    wrappedExperience.open(data, state.timeRange);
  });

  elements.btnOpenDossier?.addEventListener('click', async () => {
    const token = state.spotifyToken || (await getValidAccessToken());
    if (!token) {
      triggerLockedButtonFeedback(elements.btnOpenDossier, 'Connect Spotify to open your Taste Dossier');
      return;
    }
    state.spotifyToken = token;
    const data = state.currentData;
    if (!data?.topTracks?.length && !data?.topArtists?.length) {
      showToast('Spotify returned no listening data for this window. Try another time horizon.', 'warning');
      return;
    }
    sonicDossier.open(data, state.timeRange);
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
      if (!state.spotifyToken) {
        showToast('Connect Spotify to explore different timeframes', 'info');
        showAuthGateway();
        return;
      }
      elements.timeRangePills.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('aria-checked', 'false');
        p.tabIndex = -1;
      });
      pill.classList.add('active');
      pill.setAttribute('aria-checked', 'true');
      pill.tabIndex = 0;
      state.timeRange = pill.getAttribute('data-range');
      loadData();
    });
  });

  elements.timeRangePills?.forEach((pill, index) => {
    pill.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = elements.timeRangePills[(index + direction + elements.timeRangePills.length) % elements.timeRangePills.length];
      next.focus();
      next.click();
    });
  });

  elements.btnExportStory?.addEventListener('click', async () => {
    if (!state.currentData) {
      showToast('Connect Spotify to generate your artifacts!', 'warning');
      startSpotifyAuth();
      return;
    }
    try {
      showToast('Generating 9:16 Story card...', 'info', 2000);
      const dataUrl = await exportCardAsImage('story');
      downloadDataUrl(dataUrl, `soulseekr-${state.cardStyle}-story.png`);
      showToast('Downloaded Story image!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  elements.btnExportSquare?.addEventListener('click', async () => {
    if (!state.currentData) {
      showToast('Connect Spotify to generate your artifacts!', 'warning');
      startSpotifyAuth();
      return;
    }
    try {
      showToast('Generating Square card...', 'info', 2000);
      const dataUrl = await exportCardAsImage('square');
      downloadDataUrl(dataUrl, `soulseekr-${state.cardStyle}-square.png`);
      showToast('Downloaded Square image!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  elements.btnCopyClip?.addEventListener('click', async () => {
    if (!state.currentData) {
      showToast('Connect Spotify to generate your artifacts!', 'warning');
      startSpotifyAuth();
      return;
    }
    try {
      await copyCardToClipboard();
      showToast('Copied card snapshot to clipboard!', 'success');
    } catch (err) {
      showToast('Clipboard copy: Please click Download Image instead.', 'error');
    }
  });

  elements.btnConnectSpotify?.addEventListener('click', startSpotifyAuth);

  elements.btnGatewayConnect?.addEventListener('click', () => {
    hideAuthGateway();
    startSpotifyAuth();
  });

  elements.btnGatewayDemo?.addEventListener('click', () => {
    state.currentData = DEFAULT_CURATED_DATA;
    if (elements.demoModeIndicator) elements.demoModeIndicator.style.display = 'inline-flex';
    updateAuthBadge('SAMPLE ARCHIVE', 'unauth');
    renderCurrentCard();
    sessionStorage.setItem('soulseekr_auth_gateway_dismissed', 'true');
    hideAuthGateway();
    showToast('Sample archive opened. Connect Spotify when you want to use your own listening history.', 'info', 4000);
  });

  elements.authGatewayBackdrop?.addEventListener('click', () => {
    sessionStorage.setItem('soulseekr_auth_gateway_dismissed', 'true');
    hideAuthGateway();
  });

  elements.btnGatewayClose?.addEventListener('click', () => {
    sessionStorage.setItem('soulseekr_auth_gateway_dismissed', 'true');
    hideAuthGateway();
  });

  elements.btnDemoStageConnect?.addEventListener('click', () => {
    startSpotifyAuth();
  });

  elements.authStatusBadge?.addEventListener('click', () => {
    if (!state.spotifyToken) {
      showAuthGateway();
    }
  });

  document.addEventListener('keydown', handleGatewayKeydown);

  elements.btnLogout?.addEventListener('click', () => {
    logoutSpotify();
    state.spotifyToken = null;
    sessionStorage.removeItem('soulseekr_auth_gateway_dismissed');
    state.currentData = null;
    state.cachedRealData = {};
    showToast('Logged out of Spotify', 'info');
    loadData();
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
  updateEditionSummary(document.querySelector('.seg-btn.active'));
  setupEventListeners();
  init3DCardTilt();

  const hasAuthCode = new URLSearchParams(window.location.search).has('code');
  if (hasAuthCode) {
    try {
      showToast('Authenticating with Spotify...', 'info', 3000);
      const token = await handleAuthCallback();
      if (token) {
        state.spotifyToken = token;
        sessionStorage.setItem('soulseekr_auth_gateway_dismissed', 'true');
        hideAuthGateway();
        updateAuthBadge('SPOTIFY CONNECTED', 'active');
        showToast('Connected to Spotify! Generating artifacts...', 'success');
      }
    } catch (err) {
      console.error('Auth error:', err);
      showToast(err.message, 'error', 4500);
    }
  } else {
    const existingToken = await getValidAccessToken();
    if (existingToken) {
      state.spotifyToken = existingToken;
      sessionStorage.setItem('soulseekr_auth_gateway_dismissed', 'true');
      hideAuthGateway();
      updateAuthBadge('SPOTIFY CONNECTED', 'active');
    }
  }

  await loadData();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
