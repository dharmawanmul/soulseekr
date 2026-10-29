import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SoundEngine } from '../js/audio-player.js';

class DeferredAudio extends EventTarget {
  constructor() {
    super();
    this.paused = true;
    this.pending = [];
    this.currentTime = 0;
  }
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  play() {
    return new Promise((resolve, reject) => this.pending.push({
      finish: () => { this.paused = false; resolve(); }, reject
    }));
  }
}

function fixture() {
  const audio = new DeferredAudio();
  const engine = new SoundEngine(audio);
  engine.initAudioAnalysis = () => {};
  engine.startAnalysisLoop = () => {};
  engine.schedulePreviewStop = () => {};
  return { audio, engine };
}
const track = id => ({ id, name: id, preview_url: `https://audio.example/${id}.mp3` });

test('a delayed old Play completion never pauses a newer playing track', async () => {
  const { audio, engine } = fixture();
  const older = engine.playTrack(track('a'));
  const newer = engine.playTrack(track('b'));
  audio.pending[1].finish(); await newer;
  audio.pending[0].finish(); await older;
  assert.equal(engine.currentTrackId, 'b');
  assert.equal(engine.isPlaying, true);
  assert.equal(audio.paused, false);
  engine.stop();
});

test('Stop during a pending Resume cannot restore playback or its UI state', async () => {
  const { audio, engine } = fixture();
  const initial = engine.playTrack(track('a'));
  audio.pending[0].finish(); await initial;
  engine.pause();
  const resumed = engine.resume();
  assert.equal(engine.isLoading, true);
  engine.stop();
  audio.pending[1].finish(); await resumed;
  assert.equal(engine.currentTrackId, null);
  assert.equal(engine.isPlaying, false);
  assert.equal(engine.isLoading, false);
  assert.equal(audio.paused, true);
});

test('a delayed Resume cannot interrupt a newer track', async () => {
  const { audio, engine } = fixture();
  const initial = engine.playTrack(track('a'));
  audio.pending[0].finish(); await initial;
  engine.pause();
  const resumed = engine.resume();
  const newer = engine.playTrack(track('b'));
  audio.pending[2].finish(); await newer;
  audio.pending[1].finish(); await resumed;
  assert.equal(engine.currentTrackId, 'b');
  assert.equal(engine.isPlaying, true);
  assert.equal(audio.paused, false);
  engine.stop();
});

test('a stale playback rejection cannot clear a newer track', async () => {
  const { audio, engine } = fixture();
  const older = engine.playTrack(track('a'));
  const newer = engine.playTrack(track('b'));
  audio.pending[1].finish(); await newer;
  audio.pending[0].reject(new Error('Old playback cancelled')); await older;
  assert.equal(engine.currentTrackId, 'b');
  assert.equal(engine.isPlaying, true);
  assert.equal(engine.previewError, '');
  engine.stop();
});

test('clicking a buffering track cancels it without a late restart', async () => {
  const { audio, engine } = fixture();
  const pending = engine.playTrack(track('a'));
  assert.equal(engine.isLoading, true);
  await engine.playTrack(track('a'));
  audio.pending[0].finish(); await pending;
  assert.equal(engine.currentTrackId, null);
  assert.equal(engine.isPlaying, false);
  assert.equal(audio.paused, true);
});
