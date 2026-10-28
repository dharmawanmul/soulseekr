/**
 * Spotify PKCE (Proof Key for Code Exchange) OAuth 2.0 Module
 * 100% Client-Side Authentication (Safe for GitHub Pages static hosting - NO Client Secret needed)
 */

export const SPOTIFY_CONFIG = {
  authEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  apiEndpoint: 'https://api.spotify.com/v1',
  defaultClientId: 'e18f7dc60aba4b8dbd5566b5108fdef3',
  scopes: [
    'user-top-read',
    'user-read-private',
    'user-read-recently-played'
  ],
  storageKeys: {
    clientId: 'vibe_spotify_client_id',
    verifier: 'vibe_code_verifier',
    redirectUri: 'vibe_redirect_uri',
    token: 'vibe_access_token',
    refreshToken: 'vibe_refresh_token',
    expiresAt: 'vibe_token_expires_at'
  }
};

/**
 * Generate cryptographically secure random string for PKCE code verifier
 */
function generateCodeVerifier(length = 64) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values).map(x => possible[x % possible.length]).join('');
}

/**
 * SHA-256 hash calculation for PKCE challenge
 */
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

/**
 * Base64 URL-safe encode
 */
function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Get the standardized redirect URI for current page
 */
export function getStandardRedirectUri() {
  const origin = window.location.origin;
  let pathname = window.location.pathname.replace(/\/index\.html$/i, '');
  if (!pathname.endsWith('/')) {
    pathname += '/';
  }
  return origin + pathname;
}

/**
 * Initiate Spotify OAuth flow with PKCE
 */
export async function initiateSpotifyLogin(customClientId = null) {
  const clientId = SPOTIFY_CONFIG.defaultClientId || customClientId || localStorage.getItem(SPOTIFY_CONFIG.storageKeys.clientId);
  if (!clientId) {
    throw new Error('Please configure a Spotify Client ID.');
  }

  // Save client ID for reuse
  localStorage.setItem(SPOTIFY_CONFIG.storageKeys.clientId, clientId);

  const verifier = generateCodeVerifier();
  localStorage.setItem(SPOTIFY_CONFIG.storageKeys.verifier, verifier);

  const hashed = await sha256(verifier);
  const challenge = base64UrlEncode(hashed);

  // Save the EXACT redirect URI used during authorization to guarantee token exchange match
  const redirectUri = getStandardRedirectUri();
  console.log('[Spotify OAuth] Redirect URI sent to Spotify:', redirectUri);
  localStorage.setItem(SPOTIFY_CONFIG.storageKeys.redirectUri, redirectUri);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SPOTIFY_CONFIG.scopes.join(' ')
  });

  window.location.href = `${SPOTIFY_CONFIG.authEndpoint}?${params.toString()}`;
}

/**
 * Exchange Authorization Code for Access Token
 */
export async function handleAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');

  if (error) {
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error(`Spotify Auth Error: ${error}`);
  }

  if (!code) return null;

  const verifier = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.verifier);
  const clientId = SPOTIFY_CONFIG.defaultClientId || localStorage.getItem(SPOTIFY_CONFIG.storageKeys.clientId);
  // Retrieve the exact redirect URI stored before redirect
  const redirectUri = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.redirectUri) || getStandardRedirectUri();

  if (!verifier || !clientId) {
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error('Missing code verifier or client ID. Please initiate login again.');
  }

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    })
  };

  try {
    const res = await fetch(SPOTIFY_CONFIG.tokenEndpoint, payload);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error_description || data.error || 'Failed to exchange authorization code');
    }

    // Save tokens and compute expiration timestamp
    localStorage.setItem(SPOTIFY_CONFIG.storageKeys.token, data.access_token);
    if (data.refresh_token) {
      localStorage.setItem(SPOTIFY_CONFIG.storageKeys.refreshToken, data.refresh_token);
    }
    localStorage.setItem(SPOTIFY_CONFIG.storageKeys.clientId, clientId);
    const expiresAt = Date.now() + (data.expires_in * 1000);
    localStorage.setItem(SPOTIFY_CONFIG.storageKeys.expiresAt, expiresAt.toString());

    // Clean URL query without page reload
    window.history.replaceState({}, document.title, window.location.pathname);

    return data.access_token;
  } catch (err) {
    window.history.replaceState({}, document.title, window.location.pathname);
    throw err;
  }
}

/**
 * Refresh expired access token using refresh_token
 */
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.refreshToken);
  const clientId = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.clientId) || SPOTIFY_CONFIG.defaultClientId;

  if (!refreshToken || !clientId) {
    logoutSpotify();
    return null;
  }

  const payload = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  };

  try {
    const res = await fetch(SPOTIFY_CONFIG.tokenEndpoint, payload);
    const data = await res.json();

    if (!res.ok) {
      logoutSpotify();
      return null;
    }

    localStorage.setItem(SPOTIFY_CONFIG.storageKeys.token, data.access_token);
    if (data.refresh_token) {
      localStorage.setItem(SPOTIFY_CONFIG.storageKeys.refreshToken, data.refresh_token);
    }
    const expiresAt = Date.now() + (data.expires_in * 1000);
    localStorage.setItem(SPOTIFY_CONFIG.storageKeys.expiresAt, expiresAt.toString());

    return data.access_token;
  } catch (err) {
    console.warn('Silent token refresh failed:', err);
    logoutSpotify();
    return null;
  }
}

/**
 * Check if active access token is valid, auto-refreshing if expired
 */
export async function getValidAccessToken() {
  const token = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.token);
  const expiresAt = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.expiresAt);

  if (!token || !expiresAt) return null;

  // If expired or expiring within 60 seconds, refresh
  if (Date.now() > (parseInt(expiresAt, 10) - 60000)) {
    return await refreshAccessToken();
  }
  return token;
}

/**
 * Log out and clear stored tokens
 */
export function logoutSpotify() {
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.token);
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.refreshToken);
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.expiresAt);
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.verifier);
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.redirectUri);
}

/**
 * Generic Spotify API caller
 */
async function spotifyFetch(endpoint, token, isRetry = false) {
  const res = await fetch(`${SPOTIFY_CONFIG.apiEndpoint}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    if (!isRetry) {
      // Try one refresh
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return spotifyFetch(endpoint, refreshedToken, true);
      }
    }
    logoutSpotify();
    throw new Error('Spotify session expired. Please reconnect.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Spotify API Error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch Spotify User Profile
 */
export async function fetchUserProfile(token) {
  return spotifyFetch('/me', token);
}

/**
 * Fetch Top Tracks (time_range: 'short_term', 'medium_term', 'long_term')
 */
export async function fetchTopTracks(token, timeRange = 'short_term', limit = 10) {
  return spotifyFetch(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`, token);
}

/**
 * Fetch Top Artists
 */
export async function fetchTopArtists(token, timeRange = 'short_term', limit = 10) {
  return spotifyFetch(`/me/top/artists?time_range=${timeRange}&limit=${limit}`, token);
}

/**
 * Fetch Recently Played Tracks (for 3 AM Confessional Clock)
 */
export async function fetchRecentlyPlayed(token, limit = 50) {
  return spotifyFetch(`/me/player/recently-played?limit=${limit}`, token);
}

export const SPOTIFY_TIME_RANGES = {
  short_term: {
    label: 'About 4 weeks',
    shortLabel: '4 weeks'
  },
  medium_term: {
    label: 'About 6 months',
    shortLabel: '6 months'
  },
  long_term: {
    label: 'About 1 year',
    shortLabel: '1 year'
  }
};

async function captureSource(promise, fallback) {
  try {
    return { data: await promise, status: 'available', error: '' };
  } catch (error) {
    return {
      data: fallback,
      status: 'unavailable',
      error: error?.message || 'Request failed'
    };
  }
}

/**
 * Fetch the ranked tracks and artists needed for an honest period comparison.
 * The selected range is reused so opening the comparison does not repeat work.
 */
export async function fetchTopItemsAcrossTimeRanges(
  token,
  selectedRange,
  selectedTracks = [],
  selectedArtists = [],
  selectedStatus = { tracks: 'available', artists: 'available' }
) {
  const entries = await Promise.all(Object.keys(SPOTIFY_TIME_RANGES).map(async range => {
    if (range === selectedRange) {
      return [range, {
        tracks: selectedTracks,
        artists: selectedArtists,
        status: selectedStatus
      }];
    }

    const [tracksResult, artistsResult] = await Promise.all([
      captureSource(fetchTopTracks(token, range, 50), { items: [] }),
      captureSource(fetchTopArtists(token, range, 50), { items: [] })
    ]);

    return [range, {
      tracks: tracksResult.data?.items || [],
      artists: artistsResult.data?.items || [],
      status: {
        tracks: tracksResult.status,
        artists: artistsResult.status
      }
    }];
  }));

  return Object.fromEntries(entries);
}

/**
 * Fetch user listening data and preserve each source's retrieval status.
 */
export async function fetchCompleteUserWrapped(token, timeRange = 'short_term') {
  const retrievedAt = new Date().toISOString();
  const [userSource, tracksSource, artistsSource, recentlyPlayedSource] = await Promise.all([
    captureSource(fetchUserProfile(token), { display_name: '', images: [] }),
    captureSource(fetchTopTracks(token, timeRange, 50), { items: [] }),
    captureSource(fetchTopArtists(token, timeRange, 50), { items: [] }),
    captureSource(fetchRecentlyPlayed(token, 50), { items: [] })
  ]);

  const expiredSource = [userSource, tracksSource, artistsSource, recentlyPlayedSource]
    .find(source => /session expired/i.test(source.error));
  if (expiredSource) {
    throw new Error('Spotify session expired. Please reconnect.');
  }

  const user = userSource.data;
  const topTracks = tracksSource.data?.items || [];
  const topArtists = artistsSource.data?.items || [];
  const recentlyPlayed = recentlyPlayedSource.data?.items || [];
  const comparisonRanges = await fetchTopItemsAcrossTimeRanges(
    token,
    timeRange,
    topTracks,
    topArtists,
    { tracks: tracksSource.status, artists: artistsSource.status }
  );

  // Calculate top albums from top tracks
  const topAlbums = extractTopAlbums(topTracks);

  // Calculate dynamic acoustic stats
  const topGenres = extractTopGenres(topArtists);
  const dominantGenre = topGenres.length ? topGenres[0].name : null;

  // Obscurity rating: lower average popularity = higher underground rating
  let popularityValues = topArtists
    .map(artist => Number(artist?.popularity))
    .filter(Number.isFinite);

  // Fall back to ranked tracks popularity when Spotify returns empty top artists for short-term window
  if (!popularityValues.length && topTracks.length) {
    popularityValues = topTracks
      .map(track => Number(track?.popularity))
      .filter(Number.isFinite);
  }

  const avgPopularity = popularityValues.length
    ? Math.round(popularityValues.reduce((sum, value) => sum + value, 0) / popularityValues.length)
    : null;
  const obscurityScore = avgPopularity === null ? null : Math.max(0, Math.min(100, 100 - avgPopularity));

  const rankedTrackMinutes = Math.round(
    topTracks.reduce((total, track) => total + (Number(track.duration_ms) || 0), 0) / 60000
  );

  const rawStats = {
    dominantGenre: dominantGenre ? dominantGenre.charAt(0).toUpperCase() + dominantGenre.slice(1) : null,
    topGenre: dominantGenre ? dominantGenre.charAt(0).toUpperCase() + dominantGenre.slice(1) : null,
    vibeLabel: null,
    energyScore: null,
    danceScore: null,
    obscurityScore,
    tempoBpm: null,
    totalMinutes: null,
    rankedTrackMinutes,
    averageArtistPopularity: avgPopularity,
    genreDataAvailable: topGenres.length > 0
  };

  const aura = computeSonicAura(rawStats, topArtists, topTracks);

  return {
    user,
    topTracks,
    topArtists,
    topAlbums,
    topGenres,
    recentlyPlayed,
    comparisonRanges,
    provenance: {
      mode: 'spotify',
      retrievedAt,
      selectedRange: timeRange,
      scopes: [...SPOTIFY_CONFIG.scopes],
      sources: [
        {
          id: 'profile',
          label: 'Listener profile',
          endpoint: 'GET /me',
          status: userSource.status,
          count: userSource.status === 'available' ? 1 : 0,
          kind: 'direct'
        },
        {
          id: 'top-tracks',
          label: 'Ranked tracks',
          endpoint: `GET /me/top/tracks?time_range=${timeRange}&limit=50`,
          status: tracksSource.status,
          count: topTracks.length,
          kind: 'direct'
        },
        {
          id: 'top-artists',
          label: 'Ranked artists',
          endpoint: `GET /me/top/artists?time_range=${timeRange}&limit=50`,
          status: artistsSource.status,
          count: topArtists.length,
          kind: 'direct'
        },
        {
          id: 'recently-played',
          label: 'Recent plays',
          endpoint: 'GET /me/player/recently-played?limit=50',
          status: recentlyPlayedSource.status,
          count: recentlyPlayed.length,
          kind: 'direct'
        }
      ],
      calculations: [
        {
          label: 'Top albums',
          method: 'Counts album appearances inside the ranked top-track response. This is not a stream count.',
          kind: 'derived'
        },
        {
          label: 'Genre mix',
          method: 'Counts Spotify genre tags attached to ranked artists when the deprecated field is populated. When it is empty, the interface shows ranked artists instead of inventing genres.',
          kind: 'derived'
        },
        {
          label: 'Rarity index',
          method: 'Calculated as 100 minus the mean Spotify artist-popularity field for the ranked set.',
          kind: 'derived'
        },
        {
          label: 'Audio features',
          method: 'Energy, danceability, valence, and tempo are left unavailable because the connected endpoints do not return them.',
          kind: 'direct'
        }
      ]
    },
    stats: {
      ...rawStats,
      ...aura
    }
  };
}

/**
 * Extract distinct Top 5 Albums from tracks
 */
export function extractTopAlbums(tracks = []) {
  const albumMap = new Map();
  tracks.forEach(track => {
    if (!track.album) return;
    const albumName = track.album.name;
    const albumId = track.album.id || albumName;
    if (!albumMap.has(albumId)) {
      albumMap.set(albumId, {
        id: albumId,
        name: albumName,
        artists: track.album.artists || track.artists || [{ name: 'Unknown Artist' }],
        artistName: (track.album.artists && track.album.artists[0]?.name) || (track.artists && track.artists[0]?.name) || 'Artist',
        images: track.album.images || [],
        release_date: track.album.release_date || '',
        releaseYear: track.album.release_date ? track.album.release_date.split('-')[0] : '',
        trackCount: 1,
        tracks: [track.name]
      });
    } else {
      const existing = albumMap.get(albumId);
      existing.trackCount += 1;
      if (!existing.tracks.includes(track.name)) {
        existing.tracks.push(track.name);
      }
    }
  });

  return Array.from(albumMap.values())
    .sort((a, b) => b.trackCount - a.trackCount)
    .slice(0, 5);
}

/**
 * Extract Top 5 Genres with percentage calculation
 */
export function extractTopGenres(artists = []) {
  let allGenres = [];
  artists.forEach(a => {
    if (a.genres && a.genres.length) {
      allGenres.push(...a.genres);
    }
  });

  const genreCounts = {};
  allGenres.forEach(g => {
    const formatted = g.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    genreCounts[formatted] = (genreCounts[formatted] || 0) + 1;
  });

  const sorted = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return [];

  const total = sorted.reduce((acc, [, count]) => acc + count, 0);
  const top5 = sorted.slice(0, 5).map(([name, count]) => ({
    name,
    count,
    percentage: Math.max(5, Math.round((count / total) * 100))
  }));

  // Normalize percentages so they look great
  return top5;
}

/**
 * Compute Sonic Aura (Synesthetic color mesh & Obscurity Snob Tier)
 */
export function computeSonicAura(stats, topArtists = [], topTracks = []) {
  void topArtists;
  void topTracks;
  const obscurityScore = Number.isFinite(stats.obscurityScore) ? stats.obscurityScore : null;

  // Snob Tiers
  let obscurityTier = null;
  if (obscurityScore === null) obscurityTier = null;
  else if (obscurityScore >= 82) obscurityTier = "Ultra Crate Digger";
  else if (obscurityScore >= 70) obscurityTier = "Underground Purist";
  else if (obscurityScore >= 52) obscurityTier = "Indie Connoisseur";
  else if (obscurityScore >= 35) obscurityTier = "Eclectic Tastemaker";
  else obscurityTier = "Chart Navigator";

  const snobLabel = obscurityTier ? `${obscurityScore}% Obscurity • ${obscurityTier}` : null;

  // Aura title and synesthetic color palette
  let auraColors = ["#3b82f6", "#14b8a6", "#c084fc"];

  if (obscurityScore !== null && obscurityScore >= 72) {
    auraColors = ["#3b0764", "#6366f1", "#06b6d4"];
  } else if (stats.dominantGenre && stats.dominantGenre.toLowerCase().includes("rock")) {
    auraColors = ["#f43f5e", "#ea580c", "#7c3aed"];
  }

  const auraGradient = `radial-gradient(circle at 35% 35%, ${auraColors[0]}44 0%, transparent 65%), radial-gradient(circle at 75% 65%, ${auraColors[1]}38 0%, transparent 60%), radial-gradient(circle at 50% 50%, ${auraColors[2]}30 0%, transparent 70%)`;

  return {
    obscurityScore,
    obscurityTier,
    snobLabel,
    auraTitle: null,
    auraColors,
    auraGradient
  };
}
