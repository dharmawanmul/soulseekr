import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import * as spotify from '../js/spotify-api.js';
import { findMatchingPreview, soundEngine } from '../js/audio-player.js';

const storage = () => {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
};
const keys = spotify.SPOTIFY_CONFIG.storageKeys;
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });
const seedSession = () => {
  localStorage.setItem(keys.token, 'old');
  localStorage.setItem(keys.refreshToken, 'refresh');
  localStorage.setItem(keys.expiresAt, '1');
};

beforeEach(() => {
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  globalThis.window = {
    crypto: webcrypto,
    location: { origin: 'http://127.0.0.1:4173', pathname: '/', search: '', href: '' },
    history: { replaceState() {} }
  };
  globalThis.document = { title: 'Soulseekr' };
  spotify.logoutSpotify();
});

test('login transaction stays in this tab and matching callback consumes it', async () => {
  await spotify.initiateSpotifyLogin();
  const params = new URL(window.location.href).searchParams;
  const transaction = JSON.parse(sessionStorage.getItem('soulseekr_spotify_login'));
  assert.equal(params.get('state'), transaction.state);
  assert.equal(localStorage.getItem(keys.verifier), null);
  window.location.search = `?code=valid&state=${transaction.state}`;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.body.get('code_verifier'), transaction.verifier);
    return response({ access_token: 'new', refresh_token: 'new-refresh', expires_in: 3600 });
  };
  assert.equal(await spotify.handleAuthCallback(), 'new');
  assert.equal(sessionStorage.getItem('soulseekr_spotify_login'), null);
});

test('mismatched and expired callbacks never exchange a token', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return response({}); };
  await spotify.initiateSpotifyLogin();
  window.location.search = '?code=valid&state=wrong';
  await assert.rejects(spotify.handleAuthCallback(), /does not match/);
  sessionStorage.setItem('soulseekr_spotify_login', JSON.stringify({ state: 'old', createdAt: 1 }));
  window.location.search = '?code=valid&state=old';
  await assert.rejects(spotify.handleAuthCallback(), /expired/);
  assert.equal(calls, 0);
});

test('offline and server failures retain credentials for retry', async () => {
  seedSession();
  globalThis.fetch = async () => { throw new TypeError('Offline'); };
  await assert.rejects(spotify.getValidAccessToken(), /Offline/);
  assert.equal(localStorage.getItem(keys.refreshToken), 'refresh');
  globalThis.fetch = async () => response({ error: 'server_error' }, 503);
  await assert.rejects(spotify.refreshAccessToken(), /temporarily unavailable/);
  assert.equal(localStorage.getItem(keys.refreshToken), 'refresh');
  globalThis.fetch = async () => response({ access_token: 'recovered', expires_in: 3600 });
  assert.equal(await spotify.getValidAccessToken(), 'recovered');
});

test('rejected refresh credentials end the session', async () => {
  seedSession();
  globalThis.fetch = async () => response({ error: 'invalid_grant' }, 400);
  assert.equal(await spotify.refreshAccessToken(), null);
  assert.equal(localStorage.getItem(keys.refreshToken), null);
});

test('concurrent refreshes share one request and logout prevents late token restoration', async () => {
  seedSession();
  let calls = 0;
  let finish;
  globalThis.fetch = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const first = spotify.refreshAccessToken();
  const second = spotify.refreshAccessToken();
  assert.equal(calls, 1);
  spotify.logoutSpotify();
  finish(response({ access_token: 'late', expires_in: 3600 }));
  assert.deepEqual(await Promise.all([first, second]), [null, null]);
  assert.equal(localStorage.getItem(keys.token), null);
});

test('a second API 401 stops after one refresh and clears the rejected session', async () => {
  seedSession();
  let apiCalls = 0;
  let refreshCalls = 0;
  globalThis.fetch = async url => {
    if (url === spotify.SPOTIFY_CONFIG.tokenEndpoint) {
      refreshCalls++;
      return response({ access_token: 'also-rejected', expires_in: 3600 });
    }
    apiCalls++;
    return response({ error: { message: 'Unauthorized' } }, 401);
  };
  await assert.rejects(spotify.fetchUserProfile('old'), /session expired/);
  assert.equal(apiCalls, 2);
  assert.equal(refreshCalls, 1);
  assert.equal(localStorage.getItem(keys.token), null);
});

test('an API refresh network failure preserves the saved session', async () => {
  seedSession();
  globalThis.fetch = async url => {
    if (url === spotify.SPOTIFY_CONFIG.tokenEndpoint) throw new TypeError('Offline');
    return response({}, 401);
  };
  await assert.rejects(spotify.fetchUserProfile('old'), /Offline/);
  assert.equal(localStorage.getItem(keys.refreshToken), 'refresh');
});

test('a late 401 reuses a token refreshed by another request', async () => {
  seedSession();
  let finishOldRequest;
  let refreshCalls = 0;
  let apiCalls = 0;
  globalThis.fetch = async (url, options) => {
    if (url === spotify.SPOTIFY_CONFIG.tokenEndpoint) {
      refreshCalls++;
      return response({ access_token: 'fresh', expires_in: 3600 });
    }
    apiCalls++;
    if (options.headers.Authorization === 'Bearer fresh') return response({ id: 'listener' });
    if (apiCalls === 1) return new Promise(resolve => { finishOldRequest = resolve; });
    return response({}, 401);
  };
  const delayed = spotify.fetchUserProfile('old');
  assert.equal((await spotify.fetchUserProfile('old')).id, 'listener');
  finishOldRequest(response({}, 401));
  assert.equal((await delayed).id, 'listener');
  assert.equal(refreshCalls, 1);
});

test('preview matching rejects covers, different versions, durations and insecure URLs', () => {
  const exact = { trackName: 'Everything In Its Right Place', artistName: 'Radiohead',
    trackTimeMillis: 250000, previewUrl: 'https://audio.example/preview.m4a' };
  const candidates = [
    { ...exact, artistName: 'Tribute Band' },
    { ...exact, trackName: `${exact.trackName} (Live)` },
    { ...exact, trackTimeMillis: 290000 },
    { ...exact, previewUrl: 'http://audio.example/preview.m4a' },
    exact
  ];
  assert.equal(findMatchingPreview(candidates, exact.trackName, exact.artistName, 250000), exact);
  assert.equal(findMatchingPreview(candidates.slice(0, 4), exact.trackName, exact.artistName, 250000), null);
  assert.equal(findMatchingPreview([exact], `${exact.trackName} - 2016 Remaster`, 'RADIOHEAD', 250000), exact);
});

test('unmatched catalog audio reports unavailable without synthesizing a track', async () => {
  globalThis.fetch = async () => response({ results: [] });
  let state;
  const unsubscribe = soundEngine.onStateChange(value => { state = value; });
  await soundEngine.playTrack({ id: 'missing', name: 'No Match', artists: [{ name: 'Artist' }] });
  assert.equal(state.isPlaying, false);
  assert.match(state.previewError, /Preview unavailable/);
  assert.equal(soundEngine.synthInterval, null);
  unsubscribe();
});
