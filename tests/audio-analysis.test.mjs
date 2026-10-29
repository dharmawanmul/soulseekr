import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bandLevel, rmsLevel, PreviewTempoEstimator } from '../js/audio-analysis.js';
import { soundEngine } from '../js/audio-player.js';

test('frequency bands select bass by Hz at different device sample rates', () => {
  for (const sampleRate of [44100, 48000]) {
    const fftSize = 2048;
    const bins = new Uint8Array(fftSize / 2);
    bins[Math.round(100 / (sampleRate / fftSize))] = 255;
    assert.ok(bandLevel(bins, sampleRate, fftSize, 40, 180) > 0);
    assert.equal(bandLevel(bins, sampleRate, fftSize, 181, 4000), 0);
    bins.fill(0);
    bins[Math.round(1500 / (sampleRate / fftSize))] = 255;
    assert.equal(bandLevel(bins, sampleRate, fftSize, 40, 180), 0);
  }
});

test('RMS is a full-scale amplitude fraction and excludes DC offsets', () => {
  assert.equal(rmsLevel(new Float32Array(100)), 0);
  assert.equal(rmsLevel(Float32Array.of(0.5, -0.5, 0.5, -0.5)), 0.5);
  assert.equal(rmsLevel(Float32Array.of(0.7, 0.7, 0.7)), 0);
  assert.equal(rmsLevel([]), 0);
});

test('tempo needs a consistent sequence, then expires when the beat disappears', () => {
  const estimator = new PreviewTempoEstimator();
  for (let time = 0; time <= 2500; time += 10) estimator.update(time % 500 < 30 ? 0.8 : 0.02, time);
  assert.equal(estimator.bpm, null);
  for (let time = 2510; time <= 5000; time += 10) estimator.update(time % 500 < 30 ? 0.8 : 0.02, time);
  assert.equal(estimator.bpm, 120);
  estimator.update(0, 8000);
  assert.equal(estimator.bpm, null);
});

test('silence, sustained bass and irregular onsets never invent a tempo', () => {
  const silent = new PreviewTempoEstimator();
  const sustained = new PreviewTempoEstimator();
  const irregular = new PreviewTempoEstimator();
  const beats = new Set([0, 450, 1200, 1550, 2400, 2800, 3500, 4000, 4900, 5250]);
  for (let time = 0; time <= 5500; time += 10) {
    silent.update(0, time);
    sustained.update(0.7, time);
    irregular.update(beats.has(time) ? 0.9 : 0.01, time);
  }
  assert.equal(silent.bpm, null);
  assert.equal(sustained.bpm, null);
  assert.equal(irregular.bpm, null);
});

test('unavailable audio analysis emits resting values, not simulated measurements', () => {
  let frame;
  const unsubscribe = soundEngine.onAudioFrame(value => { frame = value; });
  soundEngine.analyzeCurrentFrame();
  assert.equal(frame.bpm, null);
  assert.equal(frame.overall, 0);
  assert.equal(frame.isResting, true);
  unsubscribe();
});
