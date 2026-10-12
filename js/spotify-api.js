/**
 * Spotify PKCE (Proof Key for Code Exchange) OAuth 2.0 Module
 * 100% Client-Side Authentication (Safe for GitHub Pages static hosting - NO Client Secret needed)
 */

export const SPOTIFY_CONFIG = {
  authEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
  apiEndpoint: 'https://api.spotify.com/v1',
  scopes: [
    'user-top-read',
    'user-read-private',
    'user-read-email'
  ],
  storageKeys: {
    clientId: 'vibe_spotify_client_id',
    verifier: 'vibe_code_verifier',
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
 * Initiate Spotify OAuth flow with PKCE
 */
export async function initiateSpotifyLogin(customClientId = null) {
  const clientId = customClientId || localStorage.getItem(SPOTIFY_CONFIG.storageKeys.clientId);
  if (!clientId) {
    throw new Error('Please enter a Spotify Client ID.');
  }

  // Save client ID for reuse
  localStorage.setItem(SPOTIFY_CONFIG.storageKeys.clientId, clientId);

  const verifier = generateCodeVerifier();
  localStorage.setItem(SPOTIFY_CONFIG.storageKeys.verifier, verifier);

  const hashed = await sha256(verifier);
  const challenge = base64UrlEncode(hashed);

  // Clean current origin + pathname as redirect URI (works on both localhost and username.github.io/repo/)
  const redirectUri = window.location.origin + window.location.pathname;

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
    // Clear URL query
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error(`Spotify Auth Error: ${error}`);
  }

  if (!code) return null;

  const verifier = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.verifier);
  const clientId = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.clientId);
  const redirectUri = window.location.origin + window.location.pathname;

  if (!verifier || !clientId) {
    window.history.replaceState({}, document.title, window.location.pathname);
    throw new Error('Missing code verifier or client ID from storage.');
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
 * Check if active access token is valid
 */
export function getValidAccessToken() {
  const token = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.token);
  const expiresAt = localStorage.getItem(SPOTIFY_CONFIG.storageKeys.expiresAt);

  if (!token || !expiresAt) return null;
  if (Date.now() > parseInt(expiresAt, 10)) {
    // Token expired
    return null;
  }
  return token;
}

/**
 * Log out and clear tokens
 */
export function logoutSpotify() {
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.token);
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.refreshToken);
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.expiresAt);
  localStorage.removeItem(SPOTIFY_CONFIG.storageKeys.verifier);
}

/**
 * Generic Spotify API caller
 */
async function spotifyFetch(endpoint, token) {
  const res = await fetch(`${SPOTIFY_CONFIG.apiEndpoint}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    logoutSpotify();
    throw new Error('Spotify session expired. Please log in again.');
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
 * Fetch User Wrapped Data and compute Stats
 */
export async function fetchCompleteUserWrapped(token, timeRange = 'short_term') {
  const [user, tracksRes, artistsRes] = await Promise.all([
    fetchUserProfile(token),
    fetchTopTracks(token, timeRange, 10),
    fetchTopArtists(token, timeRange, 10)
  ]);

  const topTracks = tracksRes.items || [];
  const topArtists = artistsRes.items || [];

  // Calculate dynamic stats
  let allGenres = [];
  topArtists.forEach(a => {
    if (a.genres && a.genres.length) {
      allGenres.push(...a.genres);
    }
  });

  // Calculate most frequent genre
  const genreCounts = {};
  allGenres.forEach(g => {
    genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]);
  const dominantGenre = sortedGenres.length ? sortedGenres[0][0] : "Eclectic Taste";

  // Obscurity rating: lower artist average popularity = higher underground rating
  const avgPopularity = topArtists.length 
    ? Math.round(topArtists.reduce((acc, a) => acc + (a.popularity || 50), 0) / topArtists.length) 
    : 70;
  const obscurityScore = Math.max(10, Math.min(99, 100 - avgPopularity + 15));

  // Energy & Dance heuristics based on genres & popularity
  const danceScore = Math.min(96, Math.max(45, Math.round(75 + (Math.sin(avgPopularity) * 15))));
  const energyScore = Math.min(98, Math.max(50, Math.round(82 + (Math.cos(avgPopularity) * 12))));
  const tempoBpm = 115 + (avgPopularity % 25);

  let vibeLabel = "Eclectic Audiophile";
  if (obscurityScore > 70) vibeLabel = "Underground Sonic Explorer";
  else if (energyScore > 85) vibeLabel = "High-Voltage Dynamo";
  else if (danceScore > 80) vibeLabel = "Club & Groove Alchemist";
  else vibeLabel = "Midnight Dreamer";

  return {
    user,
    topTracks,
    topArtists,
    stats: {
      dominantGenre: dominantGenre.charAt(0).toUpperCase() + dominantGenre.slice(1),
      vibeLabel,
      energyScore,
      danceScore,
      obscurityScore,
      tempoBpm
    }
  };
}
