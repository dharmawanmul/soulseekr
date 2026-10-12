/**
 * Soulseekr Main Application Orchestrator
 * Physical Music Artifacts with 3D Tilt & Studio Audio
 */

import { 
  initiateSpotifyLogin, 
  handleAuthCallback, 
  getValidAccessToken, 
  fetchCompleteUserWrapped, 
  computeSonicAura,
  logoutSpotify,
  SPOTIFY_CONFIG 
} from './spotify-api.js';
import { 
  renderGatewayCard,
  renderVinylCard, 
  renderSwissCard, 
  renderPrismCard, 
  renderCassetteCard, 
  renderReceiptCard,
  renderGameboyCard,
  renderVipPassCard
} from './card-renderer.js';
import { soundEngine } from './audio-player.js';
import { exportCardAsImage, downloadDataUrl, copyCardToClipboard } from './exporter.js';

// Application State
const state = {
  cardStyle: 'vinyl', // 'vinyl' | 'swiss' | 'prism' | 'cassette' | 'receipt' | 'gameboy' | 'vippass'
  timeRange: 'short_term', // 'short_term' | 'medium_term' | 'long_term'
  spotifyToken: null,
  cachedRealData: {},
  currentData: null,
  playbackState: {
    isPlaying: false,
    isLoading: false,
    trackId: null
  }
};

// DOM References (Queried on DOM ready)
const elements = {};

function initElements() {
  elements.cardContainer = document.getElementById('card-display-container');
  elements.cardTiltBox = document.getElementById('card-tilt-container');
  elements.specularGlare = document.getElementById('specular-glare');
  elements.cardStyleTabs = document.querySelectorAll('.seg-btn');
  elements.timeRangePills = document.querySelectorAll('.time-btn');
  elements.btnExportStory = document.getElementById('btn-export-story');
  elements.btnExportSquare = document.getElementById('btn-export-square');
  elements.btnCopyClip = document.getElementById('btn-copy-clip');
  elements.btnConnectSpotify = document.getElementById('btn-connect-spotify');
  elements.btnLogout = document.getElementById('btn-logout');
  elements.authStatusBadge = document.getElementById('auth-status-badge');
  elements.toastContainer = document.getElementById('toast-container');
  elements.sonicAuraMesh = document.getElementById('sonic-aura-mesh');
  elements.nowPlayingBar = document.getElementById('now-playing-bar');
  elements.dockThumb = document.getElementById('dock-thumb');
  elements.npTrackName = document.getElementById('np-track-name');
  elements.npArtistName = document.getElementById('np-artist-name');
  elements.npStopBtn = document.getElementById('np-stop-btn');
}

/**
 * Dynamic Synesthetic Sonic Aura Mesh Updater
 */
function updateSonicAura(stats) {
  if (!elements.sonicAuraMesh) return;
  if (stats && stats.auraGradient) {
    elements.sonicAuraMesh.style.background = stats.auraGradient;
    elements.sonicAuraMesh.style.opacity = '0.85';
  } else {
    elements.sonicAuraMesh.style.background = 'radial-gradient(circle at 45% 45%, rgba(139, 92, 246, 0.28) 0%, rgba(16, 185, 129, 0.2) 40%, rgba(6, 182, 212, 0.12) 70%, transparent 85%)';
    elements.sonicAuraMesh.style.opacity = '0.5';
  }
}

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info', duration = 2800) {
  const container = elements.toastContainer || document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
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
  // Real Spotify data mode
  const token = state.spotifyToken || (await getValidAccessToken());
  if (!token) {
    state.currentData = null;
    updateSonicAura(null);
    updateAuthBadge('NOT CONNECTED', 'unauth');
    renderCurrentCard();
    return;
  }

  if (state.cachedRealData[state.timeRange]) {
    state.currentData = state.cachedRealData[state.timeRange];
    updateSonicAura(state.currentData.stats);
    updateAuthBadge((state.currentData.user?.display_name || 'SPOTIFY CONNECTED').toUpperCase(), 'active');
    renderCurrentCard();
    return;
  }

  try {
    elements.cardContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 6rem 2rem; color: #a1a1aa; gap: 1rem;">
        <div class="loading-spinner"></div>
        <p style="font-size:0.875rem;">Crafting your Spotify physical artifact...</p>
      </div>
    `;
    const wrapped = await fetchCompleteUserWrapped(token, state.timeRange);
    state.cachedRealData[state.timeRange] = wrapped;
    state.currentData = wrapped;
    updateSonicAura(wrapped.stats);
    updateAuthBadge((wrapped.user?.display_name || 'SPOTIFY CONNECTED').toUpperCase(), 'active');
    renderCurrentCard();
  } catch (err) {
    console.error('Fetch wrapped error:', err);
    showToast(`Spotify API: ${err.message}`, 'error', 4500);
    state.currentData = null;
    updateSonicAura(null);
    updateAuthBadge('NOT CONNECTED', 'unauth');
    renderCurrentCard();
  }
}

function updateAuthBadge(text, status) {
  elements.authStatusBadge.textContent = text;
  elements.authStatusBadge.className = `auth-badge badge-${status}`;
  if (status === 'active') {
    elements.btnLogout.style.display = 'inline-flex';
    elements.btnConnectSpotify.style.display = 'none';
  } else {
    elements.btnLogout.style.display = 'none';
    elements.btnConnectSpotify.style.display = 'inline-flex';
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
 * Render the currently selected physical card or Gateway Prompt
 */
function renderCurrentCard() {
  if (!state.currentData) {
    elements.cardContainer.innerHTML = renderGatewayCard();
    document.getElementById('btn-gateway-auth')?.addEventListener('click', startSpotifyAuth);
    return;
  }

  let html = '';
  switch (state.cardStyle) {
    case 'vinyl':
      html = renderVinylCard(state.currentData, state.timeRange, state.playbackState);
      break;
    case 'swiss':
      html = renderSwissCard(state.currentData, state.timeRange, state.playbackState);
      break;
    case 'prism':
      html = renderPrismCard(state.currentData, state.timeRange, state.playbackState);
      break;
    case 'cassette':
      html = renderCassetteCard(state.currentData, state.timeRange, state.playbackState);
      break;
    case 'receipt':
      html = renderReceiptCard(state.currentData, state.timeRange, state.playbackState);
      break;
    case 'gameboy':
      html = renderGameboyCard(state.currentData, state.timeRange, state.playbackState);
      break;
    case 'vippass':
      html = renderVipPassCard(state.currentData, state.timeRange, state.playbackState);
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
  triggerElements.forEach(el => {
    el.addEventListener('click', async () => {
      const trackId = el.getAttribute('data-track-id');
      const track = state.currentData.topTracks.find(t => t.id === trackId);
      if (track) {
        await soundEngine.playTrack(track);
      }
    });
  });
}

/**
 * Setup Sound Engine Notifications & Dynamic Island updates
 */
soundEngine.onStateChange(({ isPlaying, isLoading, currentTrackId }) => {
  state.playbackState = { isPlaying, isLoading, trackId: currentTrackId };

  if ((isPlaying || isLoading) && currentTrackId && state.currentData) {
    const track = state.currentData.topTracks.find(t => t.id === currentTrackId);
    if (track) {
      elements.nowPlayingBar.classList.add('active');
      elements.npTrackName.textContent = track.name;
      elements.npArtistName.textContent = track.artists.map(a => a.name).join(', ');
      
      const imgUrl = (track.album && track.album.images && track.album.images[0]?.url) || '';
      if (imgUrl) elements.dockThumb.src = imgUrl;

      if (isPlaying) {
        showToast(`Playing Studio Preview: ${track.name}`, 'info', 2000);
      }
    }
  } else if (!isPlaying && !isLoading) {
    elements.nowPlayingBar.classList.remove('active');
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

    box.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    box.style.setProperty('--glare-x', `${(x / rect.width) * 100}%`);
    box.style.setProperty('--glare-y', `${(y / rect.height) * 100}%`);
  });

  box.addEventListener('mouseleave', () => {
    box.style.transform = `rotateX(0deg) rotateY(0deg)`;
  });
}

function setupEventListeners() {
  elements.npStopBtn?.addEventListener('click', () => {
    soundEngine.stop();
  });

  elements.cardStyleTabs?.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.cardStyleTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.cardStyle = btn.getAttribute('data-style');
      renderCurrentCard();
    });
  });

  elements.timeRangePills?.forEach(pill => {
    pill.addEventListener('click', () => {
      if (!state.spotifyToken) {
        showToast('Connect Spotify to explore different timeframes', 'info');
        startSpotifyAuth();
        return;
      }
      elements.timeRangePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.timeRange = pill.getAttribute('data-range');
      loadData();
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

  elements.btnLogout?.addEventListener('click', () => {
    logoutSpotify();
    state.spotifyToken = null;
    state.currentData = null;
    state.cachedRealData = {};
    showToast('Logged out of Spotify', 'info');
    loadData();
  });
}

/**
 * Application Bootstrap
 */
async function initApp() {
  initElements();
  setupEventListeners();
  init3DCardTilt();

  const hasAuthCode = new URLSearchParams(window.location.search).has('code');
  if (hasAuthCode) {
    try {
      showToast('Authenticating with Spotify...', 'info', 3000);
      const token = await handleAuthCallback();
      if (token) {
        state.spotifyToken = token;
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
    }
  }

  await loadData();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
