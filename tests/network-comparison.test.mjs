import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as spotify from '../js/spotify-api.js';
import { requestJson, retryAfterMs } from '../js/request.js';

const storage = () => {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) };
};
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { status, headers });
beforeEach(() => {
  globalThis.localStorage = storage();
  globalThis.sessionStorage = storage();
  spotify.logoutSpotify();
  localStorage.setItem(spotify.SPOTIFY_CONFIG.storageKeys.token, 'valid');
  localStorage.setItem(spotify.SPOTIFY_CONFIG.storageKeys.expiresAt, String(Date.now() + 3600000));
});

function catalogResponse(url) {
  const parsed = new URL(url);
  const range = parsed.searchParams.get('time_range') || 'short_term';
  return parsed.pathname.endsWith('/me') ? json({ id: 'listener' })
    : json({ items: [{ id: range, name: range, album: { release_date: '2020' }, genres: [] }] });
}

test('the main artifact only requests the selected window; comparisons load once on demand', async () => {
  const calls = [];
  globalThis.fetch = async url => { calls.push(String(url)); return catalogResponse(url); };
  const data = await spotify.fetchCompleteUserWrapped('valid', 'short_term');
  assert.equal(calls.length, 4);
  assert.ok(calls.every(url => !url.includes('medium_term') && !url.includes('long_term')));
  assert.equal(data.comparisonLoadState, 'idle');
  await Promise.all([spotify.loadComparisonRanges(data, 'short_term'), spotify.loadComparisonRanges(data, 'short_term')]);
  assert.equal(calls.length, 8);
  assert.equal(data.comparisonLoadState, 'ready');
  assert.equal(data.comparisonRanges.long_term.tracks[0].id, 'long_term');
  await spotify.loadComparisonRanges(data, 'short_term');
  assert.equal(calls.length, 8);
});

test('unavailable comparison windows remain honest and can be retried', async () => {
  globalThis.fetch = async url => catalogResponse(url);
  const data = await spotify.fetchCompleteUserWrapped('valid');
  globalThis.fetch = async url => String(url).includes('medium_term') ? json({}, 503) : catalogResponse(url);
  await spotify.loadComparisonRanges(data, 'short_term');
  assert.equal(data.comparisonLoadState, 'partial');
  assert.deepEqual(data.comparisonRanges.medium_term.tracks, []);
  const retried = [];
  globalThis.fetch = async url => { retried.push(String(url)); return catalogResponse(url); };
  await spotify.loadComparisonRanges(data, 'short_term');
  assert.equal(data.comparisonLoadState, 'ready');
  assert.equal(retried.length, 2);
  assert.ok(retried.every(url => url.includes('medium_term')));
});

test('a failed selected track source is a retryable failure, not a cached empty archive', async () => {
  globalThis.fetch = async url => String(url).includes('/top/tracks') ? json({}, 503) : catalogResponse(url);
  await assert.rejects(spotify.fetchCompleteUserWrapped('valid'), /could not retrieve ranked tracks/);
});

test('disconnecting invalidates pending comparisons', async () => {
  globalThis.fetch = async url => catalogResponse(url);
  const data = await spotify.fetchCompleteUserWrapped('valid');
  const pendingResponses = [];
  globalThis.fetch = url => new Promise(resolve => pendingResponses.push(() => resolve(catalogResponse(url))));
  const pending = spotify.loadComparisonRanges(data, 'short_term');
  await new Promise(resolve => setImmediate(resolve));
  spotify.logoutSpotify();
  pendingResponses.forEach(finish => finish());
  await assert.rejects(pending, /connection changed/);
  assert.equal(data.comparisonRanges.long_term, undefined);
});

test('network requests time out rather than hanging', async () => {
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('Aborted')));
  });
  await assert.rejects(requestJson('https://example.test', {}, 20), error => error.code === 'REQUEST_TIMEOUT');
});

test('Retry-After accepts seconds, dates and a missing-header fallback', () => {
  const now = Date.parse('2026-10-29T00:00:00Z');
  assert.equal(retryAfterMs('2', now), 2000);
  assert.equal(retryAfterMs('Thu, 29 Oct 2026 00:00:05 GMT', now), 5000);
  assert.equal(retryAfterMs(null, now), 30000);
});

test('429 responses expose a wait time and suppress requests until it expires', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  let calls = 0;
  globalThis.fetch = async () => { calls++; return json({}, 429, { 'Retry-After': '2' }); };
  await assert.rejects(spotify.fetchUserProfile('valid'), error => error.code === 'SPOTIFY_RATE_LIMITED' && error.retryAt === now + 2000);
  await assert.rejects(spotify.fetchUserProfile('valid'), /wait/);
  assert.equal(calls, 1);
  now += 2100;
  globalThis.fetch = async () => { calls++; return json({ id: 'recovered' }); };
  assert.equal((await spotify.fetchUserProfile('valid')).id, 'recovered');
  assert.equal(calls, 2);
});
