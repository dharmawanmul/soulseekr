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

test('unresolved fresh tracks are tried before the previous story song', async () => {
  const f = fixture();
  f.options.previous = track('previous', true);
  f.options.tracks.push(f.options.previous);
  f.options.used.add('previous');
  f.engine.playTrack = async value => {
    f.attempted.push(value.id);
    return { status: value.id === 'other' ? 'playing' : 'unavailable' };
  };
  const result = await playStorySoundtrack(f.options);
  assert.equal(result.track.id, 'other');
  assert.deepEqual(f.attempted, ['missing', 'other']);
});

test('a local instrumental is used only after all eligible real candidates fail', async () => {
  const f = fixture();
  f.options.tracks.push(track('third'), track('fourth'), track('fifth'));
  f.options.budget.remaining = 5;
  const result = await playStorySoundtrack(f.options);
  assert.equal(f.attempted.length, 5);
  assert.equal(f.instrumental(), 1);
  assert.equal(result.track.source, 'generated');
  assert.equal(result.track.name, 'Soulseekr instrumental');
});

test('a depleted search budget never selects an instrumental while candidates remain', async () => {
  const f = fixture();
  f.options.budget.remaining = 1;
  assert.equal((await playStorySoundtrack(f.options)).status, 'unavailable');
  assert.equal(f.instrumental(), 0);
});

test('fallback cannot consume the same song again on its originally assigned story', async () => {
  const f = fixture();
  const tracks = Array.from({ length: 8 }, (_, index) => track(`song-${index}`, true));
  f.options.tracks = tracks;
  f.engine.playTrack = async value => {
    f.attempted.push(value.id);
    return { status: value.id === 'missing' ? 'unavailable' : 'playing' };
  };
  const played = [];
  for (let index = 0; index < 6; index++) {
    f.options.preferred = index === 0 ? track('missing') : tracks[index - 1];
    f.options.previous = played.length ? tracks.find(value => value.id === played.at(-1)) : null;
    f.options.budget = { remaining: 9 };
    const result = await playStorySoundtrack(f.options);
    played.push(result.track.id);
  }
  assert.equal(new Set(played).size, 6);
  assert.equal(f.instrumental(), 0);
});

test('a small playable pool cycles least-recent songs but never the previous song', async () => {
  const f = fixture();
  f.options.tracks = [track('a', true), track('b', true), track('c', true)];
  f.options.used = new Set(['a', 'b', 'c']);
  f.options.previous = f.options.tracks[2];
  f.engine.playTrack = async value => ({ status: 'playing' });
  const played = [];
  for (let index = 0; index < 6; index++) {
    f.options.preferred = null;
    f.options.budget = { remaining: 3 };
    const result = await playStorySoundtrack(f.options);
    assert.notEqual(result.track.id, f.options.previous.id);
    played.push(result.track.id);
    f.options.previous = result.track;
  }
  assert.deepEqual(played, ['a', 'b', 'c', 'a', 'b', 'c']);
  assert.equal(f.instrumental(), 0);
});

test('a playable song beyond the old ten-track limit is found before using an instrumental', async () => {
  const f = fixture();
  f.options.tracks = Array.from({ length: 20 }, (_, index) => track(`candidate-${index}`));
  f.options.preferred = null;
  f.options.budget.remaining = 20;
  f.engine.playTrack = async value => {
    f.attempted.push(value.id);
    return { status: value.id === 'candidate-17' ? 'playing' : 'unavailable' };
  };
  assert.equal((await playStorySoundtrack(f.options)).track.id, 'candidate-17');
  assert.equal(f.instrumental(), 0);
});

test('Dossier can exhaust real previews without ever generating instrumental audio', async () => {
  const f = fixture();
  f.options.allowInstrumental = false;
  assert.equal((await playStorySoundtrack(f.options)).status, 'unavailable');
  assert.equal(f.instrumental(), 0);
});

test('revisiting the same story can keep its own assignment, not another story song', async () => {
  const f = fixture();
  f.options.preferred = track('own', true);
  f.options.used.add('own');
  f.options.reusePreferred = true;
  f.engine.playTrack = async value => { f.attempted.push(value.id); return { status: 'playing' }; };
  assert.equal((await playStorySoundtrack(f.options)).track.id, 'own');
  f.options.previous = track('own');
  assert.notEqual((await playStorySoundtrack(f.options)).track.id, 'own');
});

test('preview discovery runs at most three lookups ahead and plays only matched audio', async () => {
  const f = fixture();
  f.options.tracks = Array.from({ length: 12 }, (_, index) => track(`candidate-${index}`));
  f.options.preferred = null;
  f.options.budget.remaining = 12;
  let active = 0;
  let maxActive = 0;
  f.engine.resolveRealAudioPreview = async name => {
    active++;
    maxActive = Math.max(maxActive, active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
    return name === 'candidate-11' ? 'https://audio.example/verified' : null;
  };
  f.engine.playTrack = async value => { f.attempted.push(value.id); return { status: 'playing' }; };
  assert.equal((await playStorySoundtrack(f.options)).track.id, 'candidate-11');
  assert.ok(maxActive <= 3);
  assert.deepEqual(f.attempted, ['candidate-11']);
  assert.equal(f.instrumental(), 0);
});

test('duplicate track entries retain a supplied preview and are attempted only once', async () => {
  const f = fixture();
  f.options.preferred = track('duplicate');
  f.options.tracks = [track('duplicate'), track('duplicate', true)];
  f.engine.playTrack = async value => {
    f.attempted.push(value.id);
    assert.ok(value.preview_url);
    return { status: 'playing' };
  };
  assert.equal((await playStorySoundtrack(f.options)).track.id, 'duplicate');
  assert.deepEqual(f.attempted, ['duplicate']);
});

test('cancelling catalog discovery does not play, fail, or consume a song', async () => {
  const f = fixture();
  let current = true;
  f.options.isCurrent = () => current;
  f.engine.resolveRealAudioPreview = async () => { current = false; return 'https://audio.example/found'; };
  assert.equal((await playStorySoundtrack(f.options)).status, 'cancelled');
  assert.equal(f.options.used.size, 0);
  assert.equal(f.options.failed.size, 0);
  assert.deepEqual(f.attempted, []);
  assert.equal(f.instrumental(), 0);
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
