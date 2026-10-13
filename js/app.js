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
  renderGameboyCard,
  renderVipPassCard
} from './card-renderer.js';
import { soundEngine } from './audio-player.js';
import { exportCardAsImage, downloadDataUrl, copyCardToClipboard } from './exporter.js';
import { wrappedExperience } from './wrapped-experience.js';
import { amazeMe } from './amaze-me.js';

// Curated default preview data allowing instant, responsive exploration across all 7 card archetypes
export const DEFAULT_CURATED_DATA = {
  user: {
    display_name: 'Soulseekr Archivist',
    images: [{ url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }]
  },
  timeRange: 'short_term',
  topTracks: [
    {
      id: 'preview_1',
      name: 'Starboy',
      artists: [{ name: 'The Weeknd', id: 'art_1' }, { name: 'Daft Punk', id: 'art_2' }],
      album: {
        name: 'Starboy',
        images: [{ url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 230453,
      preview_url: null
    },
    {
      id: 'preview_2',
      name: 'Midnight City',
      artists: [{ name: 'M83', id: 'art_3' }],
      album: {
        name: "Hurry Up, We're Dreaming",
        images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 243266,
      preview_url: null
    },
    {
      id: 'preview_3',
      name: 'The Less I Know The Better',
      artists: [{ name: 'Tame Impala', id: 'art_4' }],
      album: {
        name: 'Currents',
        images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 216320,
      preview_url: null
    },
    {
      id: 'preview_4',
      name: '505',
      artists: [{ name: 'Arctic Monkeys', id: 'art_5' }],
      album: {
        name: 'Favourite Worst Nightmare',
        images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 253586,
      preview_url: null
    },
    {
      id: 'preview_5',
      name: 'Dreams',
      artists: [{ name: 'Fleetwood Mac', id: 'art_6' }],
      album: {
        name: 'Rumours',
        images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }]
      },
      duration_ms: 257800,
      preview_url: null
    }
  ],
  topArtists: [
    { name: 'The Weeknd', genres: ['canadian pop', 'r&b'], images: [{ url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'M83', genres: ['indie rock', 'synthpop'], images: [{ url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Tame Impala', genres: ['neo-psychedelia'], images: [{ url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Arctic Monkeys', genres: ['garage rock', 'indie rock'], images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80' }] },
    { name: 'Fleetwood Mac', genres: ['classic rock', 'soft rock'], images: [{ url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80' }] }
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
    { name: 'Neo-Psychedelia', count: 9, percentage: 38 },
    { name: 'Synthpop & Wave', count: 6, percentage: 24 },
    { name: 'Indie Rock', count: 5, percentage: 19 },
    { name: 'R&B / Soul', count: 3, percentage: 12 },
    { name: 'Alternative Pop', count: 2, percentage: 7 }
  ],
  stats: {
    dominantGenre: 'Neo-Psychedelia / Synthpop',
    topGenre: 'Neo-Psychedelia / Synthpop',
    obscurityScore: 78,
    obscurityTier: 'Underground Crate Digger',
    totalMinutes: 48320,
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
  currentData: DEFAULT_CURATED_DATA,
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
  elements.btnOpenWrapped = document.getElementById('btn-open-wrapped');
  elements.btnAmazeMe = document.getElementById('btn-amaze-me');
  elements.btnConnectSpotify = document.getElementById('btn-connect-spotify');
  elements.btnLogout = document.getElementById('btn-logout');
  elements.authStatusBadge = document.getElementById('auth-status-badge');
  elements.toastContainer = document.getElementById('toast-container');
  elements.nowPlayingBar = document.getElementById('now-playing-bar');
  elements.dockThumb = document.getElementById('dock-thumb');
  elements.npTrackName = document.getElementById('np-track-name');
  elements.npArtistName = document.getElementById('np-artist-name');
  elements.npStopBtn = document.getElementById('np-stop-btn');
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
  const token = state.spotifyToken || (await getValidAccessToken());
  if (!token) {
    state.currentData = DEFAULT_CURATED_DATA;
    updateAuthBadge('PREVIEW • CONNECT SPOTIFY', 'unauth');
    renderCurrentCard();
    return;
  }

  if (state.cachedRealData[state.timeRange]) {
    state.currentData = state.cachedRealData[state.timeRange];
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
    updateAuthBadge((wrapped.user?.display_name || 'SPOTIFY CONNECTED').toUpperCase(), 'active');
    renderCurrentCard();
  } catch (err) {
    console.error('Fetch wrapped error:', err);
    showToast(`Spotify API: ${err.message}`, 'error', 4500);
    state.currentData = DEFAULT_CURATED_DATA;
    updateAuthBadge('PREVIEW • CONNECT SPOTIFY', 'unauth');
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
 * Render the currently selected physical card directly
 */
function renderCurrentCard() {
  const data = state.currentData || DEFAULT_CURATED_DATA;
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
    case 'gameboy':
      html = renderGameboyCard(data, state.timeRange, state.playbackState);
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
  const data = state.currentData || DEFAULT_CURATED_DATA;
  triggerElements.forEach(el => {
    el.addEventListener('click', async () => {
      const trackId = el.getAttribute('data-track-id');
      const track = data.topTracks.find(t => t.id === trackId);
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
  const data = state.currentData || DEFAULT_CURATED_DATA;

  if ((isPlaying || isLoading) && currentTrackId && data) {
    const track = data.topTracks.find(t => t.id === currentTrackId);
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

function setupEventListeners() {
  elements.btnOpenWrapped?.addEventListener('click', () => {
    const data = state.currentData || DEFAULT_CURATED_DATA;
    wrappedExperience.open(data, state.timeRange);
  });

  elements.btnAmazeMe?.addEventListener('click', () => {
    const data = state.currentData || DEFAULT_CURATED_DATA;
    amazeMe.open(data, state.timeRange);
  });

  elements.npStopBtn?.addEventListener('click', () => {
    soundEngine.stop();
  });

  elements.cardStyleTabs?.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.cardStyleTabs.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
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
    state.currentData = DEFAULT_CURATED_DATA; // keep preview rather than flashing blank
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
