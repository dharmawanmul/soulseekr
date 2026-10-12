/**
 * SoundWrapped Main Application Orchestrator
 */

import { mockData } from './mock-data.js';
import { 
  initiateSpotifyLogin, 
  handleAuthCallback, 
  getValidAccessToken, 
  fetchCompleteUserWrapped, 
  logoutSpotify,
  SPOTIFY_CONFIG 
} from './spotify-api.js';
import { 
  renderFestivalCard, 
  renderDnaCard, 
  renderRetroCard, 
  renderArcadeCard, 
  renderReceiptCard 
} from './card-renderer.js';
import { soundEngine } from './audio-player.js';
import { exportCardAsImage, downloadDataUrl, copyCardToClipboard } from './exporter.js';

// Application State
const state = {
  cardStyle: 'festival', // 'festival' | 'dna' | 'retro' | 'arcade' | 'receipt'
  timeRange: 'short_term', // 'short_term' | 'medium_term' | 'long_term'
  isDemoMode: true,
  spotifyToken: null,
  cachedRealData: {}, // per timeRange
  currentData: null,
  activeTrackId: null
};

// DOM References
const elements = {
  cardContainer: document.getElementById('card-display-container'),
  cardStyleTabs: document.querySelectorAll('.card-style-btn'),
  timeRangePills: document.querySelectorAll('.time-pill'),
  btnExportStory: document.getElementById('btn-export-story'),
  btnExportSquare: document.getElementById('btn-export-square'),
  btnCopyClip: document.getElementById('btn-copy-clip'),
  btnConnectSpotify: document.getElementById('btn-connect-spotify'),
  btnToggleDemo: document.getElementById('btn-toggle-demo'),
  btnLogout: document.getElementById('btn-logout'),
  authStatusBadge: document.getElementById('auth-status-badge'),
  clientIdModal: document.getElementById('client-id-modal'),
  clientIdInput: document.getElementById('client-id-input'),
  btnModalSubmit: document.getElementById('btn-modal-submit'),
  btnModalCancel: document.getElementById('btn-modal-cancel'),
  toastContainer: document.getElementById('toast-container'),
  nowPlayingBar: document.getElementById('now-playing-bar'),
  npTrackName: document.getElementById('np-track-name'),
  npArtistName: document.getElementById('np-artist-name'),
  npStopBtn: document.getElementById('np-stop-btn')
};

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  elements.toastContainer.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/**
 * Update UI Data based on mode & range
 */
async function loadData() {
  if (state.isDemoMode) {
    state.currentData = mockData[state.timeRange];
    updateAuthBadge('DEMO MODE', 'demo');
    renderCurrentCard();
    return;
  }

  // Real Spotify data mode
  const token = state.spotifyToken || getValidAccessToken();
  if (!token) {
    state.isDemoMode = true;
    state.currentData = mockData[state.timeRange];
    updateAuthBadge('DEMO MODE', 'demo');
    renderCurrentCard();
    return;
  }

  // Check cache
  if (state.cachedRealData[state.timeRange]) {
    state.currentData = state.cachedRealData[state.timeRange];
    updateAuthBadge('CONNECTED', 'active');
    renderCurrentCard();
    return;
  }

  try {
    elements.cardContainer.innerHTML = `
      <div class="card-loading-state">
        <div class="loading-spinner"></div>
        <p>Crunching your Spotify acoustic data...</p>
      </div>
    `;
    const wrapped = await fetchCompleteUserWrapped(token, state.timeRange);
    state.cachedRealData[state.timeRange] = wrapped;
    state.currentData = wrapped;
    updateAuthBadge(wrapped.user.display_name.toUpperCase(), 'active');
    renderCurrentCard();
  } catch (err) {
    console.error('Fetch wrapped error:', err);
    showToast(`Spotify API: ${err.message}`, 'error', 4500);
    state.isDemoMode = true;
    state.currentData = mockData[state.timeRange];
    updateAuthBadge('DEMO MODE', 'demo');
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

/**
 * Render the currently selected card
 */
function renderCurrentCard() {
  if (!state.currentData) return;

  let html = '';
  switch (state.cardStyle) {
    case 'festival':
      html = renderFestivalCard(state.currentData, state.timeRange, state.activeTrackId);
      break;
    case 'dna':
      html = renderDnaCard(state.currentData, state.timeRange, state.activeTrackId);
      break;
    case 'retro':
      html = renderRetroCard(state.currentData, state.timeRange, state.activeTrackId);
      break;
    case 'arcade':
      html = renderArcadeCard(state.currentData, state.timeRange, state.activeTrackId);
      break;
    case 'receipt':
      html = renderReceiptCard(state.currentData, state.timeRange, state.activeTrackId);
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
    el.addEventListener('click', () => {
      const trackId = el.getAttribute('data-track-id');
      const track = state.currentData.topTracks.find(t => t.id === trackId);
      if (track) {
        soundEngine.playTrack(track);
      }
    });
  });
}

/**
 * Setup Sound Engine Notifications
 */
soundEngine.onStateChange(({ isPlaying, currentTrackId }) => {
  state.activeTrackId = isPlaying ? currentTrackId : null;

  if (isPlaying && currentTrackId && state.currentData) {
    const track = state.currentData.topTracks.find(t => t.id === currentTrackId);
    if (track) {
      elements.nowPlayingBar.classList.add('active');
      elements.npTrackName.textContent = track.name;
      elements.npArtistName.textContent = track.artists.map(a => a.name).join(', ');
      showToast(`Now Playing: ${track.name}`, 'info', 2000);
    }
  } else {
    elements.nowPlayingBar.classList.remove('active');
  }

  // Refresh active playback indicator on cards without re-creating DOM
  renderCurrentCard();
});

elements.npStopBtn.addEventListener('click', () => {
  soundEngine.stop();
});

/**
 * Setup Card Style Switcher Buttons
 */
elements.cardStyleTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    elements.cardStyleTabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.cardStyle = btn.getAttribute('data-style');
    renderCurrentCard();
  });
});

/**
 * Setup Time Range Pills
 */
elements.timeRangePills.forEach(pill => {
  pill.addEventListener('click', () => {
    elements.timeRangePills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.timeRange = pill.getAttribute('data-range');
    loadData();
  });
});

/**
 * Setup Export Actions
 */
elements.btnExportStory.addEventListener('click', async () => {
  try {
    showToast('Generating 9:16 Story card...', 'info', 2000);
    const dataUrl = await exportCardAsImage('story');
    downloadDataUrl(dataUrl, `soundwrapped-${state.cardStyle}-story.png`);
    showToast('Downloaded Story image!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

elements.btnExportSquare.addEventListener('click', async () => {
  try {
    showToast('Generating Square card...', 'info', 2000);
    const dataUrl = await exportCardAsImage('square');
    downloadDataUrl(dataUrl, `soundwrapped-${state.cardStyle}-square.png`);
    showToast('Downloaded Square image!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

elements.btnCopyClip.addEventListener('click', async () => {
  try {
    await copyCardToClipboard();
    showToast('Copied card snapshot to clipboard!', 'success');
  } catch (err) {
    showToast('Clipboard access denied or unsupported.', 'error');
  }
});

/**
 * Setup Spotify Auth and Modal
 */
elements.btnConnectSpotify.addEventListener('click', () => {
  const savedId = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.clientId);
  if (savedId) {
    elements.clientIdInput.value = savedId;
  }
  elements.clientIdModal.classList.add('modal-open');
});

elements.btnModalCancel.addEventListener('click', () => {
  elements.clientIdModal.classList.remove('modal-open');
});

elements.btnModalSubmit.addEventListener('click', async () => {
  const clientId = elements.clientIdInput.value.trim();
  if (!clientId) {
    showToast('Please enter your Spotify Client ID.', 'error');
    return;
  }

  elements.clientIdModal.classList.remove('modal-open');
  showToast('Redirecting to Spotify Login...', 'info', 2000);

  try {
    await initiateSpotifyLogin(clientId);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

elements.btnToggleDemo.addEventListener('click', () => {
  state.isDemoMode = true;
  state.cachedRealData = {};
  showToast('Switched to Demo preview mode', 'info');
  loadData();
});

elements.btnLogout.addEventListener('click', () => {
  logoutSpotify();
  state.spotifyToken = null;
  state.isDemoMode = true;
  state.cachedRealData = {};
  showToast('Logged out of Spotify', 'info');
  loadData();
});

/**
 * Application Bootstrap
 */
async function initApp() {
  // Check for PKCE callback
  const hasAuthCode = new URLSearchParams(window.location.search).has('code');
  if (hasAuthCode) {
    try {
      showToast('Authenticating with Spotify...', 'info', 3000);
      const token = await handleAuthCallback();
      if (token) {
        state.spotifyToken = token;
        state.isDemoMode = false;
        showToast('Successfully connected to Spotify!', 'success');
      }
    } catch (err) {
      console.error('Auth error:', err);
      showToast(err.message, 'error', 4000);
    }
  } else {
    // Check if token exists from previous session
    const existingToken = getValidAccessToken();
    if (existingToken) {
      state.spotifyToken = existingToken;
      state.isDemoMode = false;
    }
  }

  // Load initial data
  await loadData();
}

// Start app
window.addEventListener('DOMContentLoaded', initApp);
