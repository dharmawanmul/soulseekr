import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playStorySoundtrack, INSTRUMENTAL_TRACK } from '../js/story-soundtrack.js';
import { SoundEngine } from '../js/audio-player.js';

const track = (id, ready = false) => ({ id, name: id, ...(ready ? { preview_url: `https://audio.example/${id}` } : {}) });
function fixture() {
  const attempted = [];
  let instrumental = 0;
  const engine = {
    playTrack: async value => { attempted.push(value.id); return { status: 'unavailable' }; },
    playInstrumental: async () => { instrumental++; return { status: 'playing', track: INSTRUMENTAL_TRACK }; }
  };
  return { engine, attempted, instrumental: () => instrumental,
    options: { engine, preferred: track('missing'), tracks: [track('missing'), track('other')],
      previous: null, used: new Set(), failed: new Set(), budget: { remaining: 3 },
      isCurrent: () => true, onAttempt() {} } };
}

test('an unavailable soundtrack falls back to another verified ranked track', async () => {
  const f = fixture();
  const available = track('available', true);
  f.options.tracks.push(available);
  f.engine.playTrack = async value => {
    f.attempted.push(value.id);
    return { status: value.id === 'available' ? 'playing' : 'unavailable' };
  };
  const result = await playStorySoundtrack(f.options);
  assert.deepEqual(f.attempted, ['missing', 'available']);
  assert.equal(result.track.id, 'available');
  assert.equal(result.fallback, true);
  assert.equal(f.instrumental(), 0);
});

test('a previously working preview can be reused when no fresh ready track exists', async () => {
  const f = fixture();
  f.options.previous = track('previous', true);
  f.options.tracks.push(f.options.previous);
  f.options.used.add('previous');
  f.engine.playTrack = async value => {
    f.attempted.push(value.id);
    return { status: value.id === 'previous' ? 'playing' : 'unavailable' };
  };
  const result = await playStorySoundtrack(f.options);
  assert.equal(result.track.id, 'previous');
  assert.deepEqual(f.attempted, ['missing', 'previous']);
});

test('missing previews use a labelled local instrumental with bounded attempts', async () => {
  const f = fixture();
  f.options.tracks.push(track('third'), track('fourth'), track('fifth'));
  const result = await playStorySoundtrack(f.options);
  assert.equal(f.attempted.length, 3);
  assert.equal(f.instrumental(), 1);
  assert.equal(result.track.source, 'generated');
  assert.equal(result.track.name, 'Soulseekr instrumental');
});

test('mute, navigation or closing during a failed lookup cancels the fallback chain', async () => {
  const f = fixture();
  let current = true;
  f.options.isCurrent = () => current;
  f.engine.playTrack = async () => { current = false; return { status: 'unavailable' }; };
  assert.equal((await playStorySoundtrack(f.options)).status, 'cancelled');
  assert.equal(f.instrumental(), 0);
});

test('browser autoplay denial requests a user gesture rather than cycling tracks', async () => {
  const f = fixture();
  f.engine.playTrack = async () => ({ status: 'blocked' });
  assert.equal((await playStorySoundtrack(f.options)).status, 'blocked');
  assert.equal(f.instrumental(), 0);
});

test('a generated assignment is never searched as a real catalog track', async () => {
  const f = fixture();
  f.options.preferred = INSTRUMENTAL_TRACK;
  f.options.tracks = [];
  const result = await playStorySoundtrack(f.options);
  assert.equal(result.track.source, 'generated');
  assert.deepEqual(f.attempted, []);
});

test('preloading and playback share one catalog lookup for the same track', async t => {
  const engine = new SoundEngine(null);
  let finish;
  let calls = 0;
  t.mock.method(globalThis, 'fetch', () => { calls++; return new Promise(resolve => { finish = resolve; }); });
  const first = engine.resolveRealAudioPreview('Song', 'Artist', 200000);
  const second = engine.resolveRealAudioPreview('Song', 'Artist', 200000);
  assert.equal(calls, 1);
  finish(new Response(JSON.stringify({ results: [{ trackName: 'Song', artistName: 'Artist',
    trackTimeMillis: 200000, previewUrl: 'https://audio.example/preview' }] })));
  assert.deepEqual(await Promise.all([first, second]), ['https://audio.example/preview', 'https://audio.example/preview']);
  assert.equal(engine.previewRequests.size, 0);
});

test('failed preview lookups are released so a later user retry can succeed', async t => {
  const engine = new SoundEngine(null);
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ results: [] })));
  assert.equal(await engine.resolveRealAudioPreview('Song', 'Artist'), null);
  assert.equal(engine.previewRequests.size, 0);
});

test('local instrumental waits for the audio context to unlock', async () => {
  const engine = new SoundEngine(null);
  engine.initAudioContext = async () => { engine.audioContext = { state: 'running' }; };
  engine.playSynthesizedLoop = () => { engine.isPlaying = true; };
  const result = await engine.playInstrumental();
  assert.equal(result.status, 'playing');
  assert.equal(result.track.source, 'generated');
  engine.stop();
});

test('stopping during context unlock prevents a delayed instrumental start', async () => {
  const engine = new SoundEngine(null);
  let finish;
  let starts = 0;
  engine.initAudioContext = () => new Promise(resolve => { finish = resolve; });
  engine.playSynthesizedLoop = () => { starts++; };
  const pending = engine.playInstrumental();
  engine.stop();
  engine.audioContext = { state: 'running' };
  finish();
  assert.equal((await pending).status, 'cancelled');
  assert.equal(starts, 0);
  assert.equal(engine.currentTrack, null);
});

test('unsupported local audio returns a recoverable blocked result', async () => {
  const engine = new SoundEngine(null);
  assert.equal((await engine.playInstrumental()).status, 'blocked');
  assert.equal(engine.currentTrack, null);
  assert.equal(engine.isPlaying, false);
});
