/**
 * SoundWrapped Main Application Orchestrator
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
  renderGatewayCard,
  renderVinylCard, 
  renderSwissCard, 
  renderPrismCard, 
  renderCassetteCard, 
  renderReceiptCard 
} from './card-renderer.js';
import { soundEngine } from './audio-player.js';
import { exportCardAsImage, downloadDataUrl, copyCardToClipboard } from './exporter.js';

// Application State
const state = {
  cardStyle: 'vinyl', // 'vinyl' | 'swiss' | 'prism' | 'cassette' | 'receipt'
  timeRange: 'short_term', // 'short_term' | 'medium_term' | 'long_term' | 'custom'
  spotifyToken: null,
  cachedRealData: {},
  currentData: null,
  playbackState: {
    isPlaying: false,
    isLoading: false,
    trackId: null
  }
};

// Preset Mixes for Custom Mix creation
const PRESETS = {
  synthwave: [
    { name: "Starboy", artist: "The Weeknd" },
    { name: "Midnight City", artist: "M83" },
    { name: "Nightcall", artist: "Kavinsky" },
    { name: "Tech Noir", artist: "GUNSHIP" },
    { name: "Instant Crush", artist: "Daft Punk" }
  ],
  indie: [
    { name: "505", artist: "Arctic Monkeys" },
    { name: "Last Nite", artist: "The Strokes" },
    { name: "1901", artist: "Phoenix" },
    { name: "The Less I Know The Better", artist: "Tame Impala" },
    { name: "Mr. Brightside", artist: "The Killers" }
  ],
  pop: [
    { name: "Levitating", artist: "Dua Lipa" },
    { name: "Bad Guy", artist: "Billie Eilish" },
    { name: "As It Was", artist: "Harry Styles" },
    { name: "Kill Bill", artist: "SZA" },
    { name: "vampire", artist: "Olivia Rodrigo" }
  ],
  classics: [
    { name: "Heroes", artist: "David Bowie" },
    { name: "Dreams", artist: "Fleetwood Mac" },
    { name: "Blue Monday", artist: "New Order" },
    { name: "Bohemian Rhapsody", artist: "Queen" },
    { name: "Purple Rain", artist: "Prince" }
  ]
};

// DOM References
const elements = {
  cardContainer: document.getElementById('card-display-container'),
  cardTiltBox: document.getElementById('card-tilt-container'),
  specularGlare: document.getElementById('specular-glare'),
  cardStyleTabs: document.querySelectorAll('.seg-btn'),
  timeRangePills: document.querySelectorAll('.time-btn'),
  btnExportStory: document.getElementById('btn-export-story'),
  btnExportSquare: document.getElementById('btn-export-square'),
  btnCopyClip: document.getElementById('btn-copy-clip'),
  btnConnectSpotify: document.getElementById('btn-connect-spotify'),
  btnCustomMix: document.getElementById('btn-custom-mix'),
  btnLogout: document.getElementById('btn-logout'),
  authStatusBadge: document.getElementById('auth-status-badge'),
  customMixModal: document.getElementById('custom-mix-modal'),
  btnCustomCancel: document.getElementById('btn-custom-cancel'),
  btnCustomCancelAlt: document.getElementById('btn-custom-cancel-alt'),
  btnCustomGenerate: document.getElementById('btn-custom-generate'),
  presetChips: document.querySelectorAll('.preset-chip'),
  toastContainer: document.getElementById('toast-container'),
  nowPlayingBar: document.getElementById('now-playing-bar'),
  dockThumb: document.getElementById('dock-thumb'),
  npTrackName: document.getElementById('np-track-name'),
  npArtistName: document.getElementById('np-artist-name'),
  npStopBtn: document.getElementById('np-stop-btn')
};

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info', duration = 2800) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  elements.toastContainer.appendChild(toast);

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
  if (state.timeRange === 'custom' && state.currentData) {
    updateAuthBadge('CUSTOM MIX', 'custom');
    renderCurrentCard();
    return;
  }

  // Real Spotify data mode
  const token = state.spotifyToken || (await getValidAccessToken());
  if (!token) {
    state.currentData = null;
    updateAuthBadge('NOT CONNECTED', 'unauth');
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
    state.currentData = null;
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
    document.getElementById('btn-gateway-custom')?.addEventListener('click', () => {
      elements.customMixModal.classList.add('modal-open');
    });
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

elements.npStopBtn.addEventListener('click', () => {
  soundEngine.stop();
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

/**
 * Segmented Control Style Tabs
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
 * Time Range Segmented Buttons
 */
elements.timeRangePills.forEach(pill => {
  pill.addEventListener('click', () => {
    if (!state.spotifyToken && state.timeRange !== 'custom') {
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

/**
 * Setup High-DPI Export Actions
 */
elements.btnExportStory.addEventListener('click', async () => {
  if (!state.currentData) {
    showToast('Connect Spotify or generate a custom mix first!', 'warning');
    startSpotifyAuth();
    return;
  }
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
  if (!state.currentData) {
    showToast('Connect Spotify or generate a custom mix first!', 'warning');
    startSpotifyAuth();
    return;
  }
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
  if (!state.currentData) {
    showToast('Connect Spotify or generate a custom mix first!', 'warning');
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

/**
 * Spotify Auth Trigger (1-Click Direct Redirect)
 */
elements.btnConnectSpotify.addEventListener('click', startSpotifyAuth);



elements.btnLogout.addEventListener('click', () => {
  logoutSpotify();
  state.spotifyToken = null;
  state.currentData = null;
  state.cachedRealData = {};
  showToast('Logged out of Spotify', 'info');
  loadData();
});

/**
 * Custom Mix Modal & Presets
 */
elements.btnCustomMix.addEventListener('click', () => elements.customMixModal.classList.add('modal-open'));
elements.btnCustomCancel.addEventListener('click', () => elements.customMixModal.classList.remove('modal-open'));
elements.btnCustomCancelAlt?.addEventListener('click', () => elements.customMixModal.classList.remove('modal-open'));

elements.presetChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const presetKey = chip.getAttribute('data-preset');
    const songs = PRESETS[presetKey];
    if (!songs) return;

    const rowInputs = document.querySelectorAll('.custom-input-row');
    songs.forEach((s, i) => {
      if (rowInputs[i]) {
        rowInputs[i].querySelector('.c-song').value = s.name;
        rowInputs[i].querySelector('.c-artist').value = s.artist;
      }
    });
    showToast(`Loaded "${chip.textContent}" preset`, 'info', 1500);
  });
});

elements.btnCustomGenerate.addEventListener('click', async () => {
  const rowInputs = document.querySelectorAll('.custom-input-row');
  const tracksToFetch = [];

  rowInputs.forEach((row) => {
    const name = row.querySelector('.c-song').value.trim();
    const artist = row.querySelector('.c-artist').value.trim();
    if (name) {
      tracksToFetch.push({ name, artist: artist || 'Various Artists' });
    }
  });

  if (tracksToFetch.length < 3) {
    showToast('Please enter at least 3 tracks.', 'error');
    return;
  }

  elements.customMixModal.classList.remove('modal-open');
  showToast('Resolving real studio previews & artwork...', 'info', 3000);

  try {
    elements.cardContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 6rem 2rem; color: #a1a1aa; gap: 1rem;">
        <div class="loading-spinner"></div>
        <p style="font-size:0.875rem;">Fetching studio master audio & covers...</p>
      </div>
    `;

    const resolvedTracks = await Promise.all(tracksToFetch.map(async (item, idx) => {
      const q = `${item.artist} ${item.name}`.trim();
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=1`);
      const json = await res.json();
      const hit = json.results && json.results[0];

      return {
        id: `custom_t_${idx + 1}`,
        name: hit?.trackName || item.name,
        artists: [{ name: hit?.artistName || item.artist }],
        album: {
          name: hit?.collectionName || 'Custom Collection',
          images: [{ url: hit?.artworkUrl100?.replace('100x100bb', '600x600bb') || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80' }]
        },
        duration_ms: hit?.trackTimeMillis || 215000,
        preview_url: hit?.previewUrl || null,
        energy: 0.85,
        danceability: 0.76
      };
    }));

    const topArtists = [...new Set(resolvedTracks.map(t => t.artists[0].name))].map((name, i) => ({
      id: `custom_a_${i}`,
      name: name,
      genres: ['curated collection']
    }));

    state.currentData = {
      user: {
        display_name: 'Custom Curator',
        images: [{ url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }]
      },
      topTracks: resolvedTracks,
      topArtists: topArtists,
      stats: {
        dominantGenre: 'Handcrafted Sonic Palette',
        vibeLabel: 'Master Curator',
        energyScore: 88,
        danceScore: 79,
        obscurityScore: 72,
        tempoBpm: 124
      }
    };

    state.timeRange = 'custom';
    updateAuthBadge('CUSTOM MIX', 'custom');
    renderCurrentCard();
    showToast('Physical artifacts generated with real studio previews!', 'success');
  } catch (err) {
    console.error('Custom mix error:', err);
    showToast('Could not load track data: ' + err.message, 'error');
    loadData();
  }
});

/**
 * Application Bootstrap
 */
async function initApp() {
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

window.addEventListener('DOMContentLoaded', initApp);
