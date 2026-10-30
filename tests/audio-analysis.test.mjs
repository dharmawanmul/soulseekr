import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bandLevel, rmsLevel, previewMeterLevel, PreviewTempoEstimator } from '../js/audio-analysis.js';
import { SoundEngine, soundEngine } from '../js/audio-player.js';

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
  assert.equal(frame.left, 0);
  assert.equal(frame.right, 0);
  assert.equal(frame.stereoAvailable, false);
  unsubscribe();
});

test('preview meters use a bounded dBFS scale with no minimum fake activity', () => {
  for (const value of [0, -1, NaN, Infinity, 0.00001, 0.001]) assert.equal(previewMeterLevel(value), 0);
  assert.equal(previewMeterLevel(0.01), 1 / 3);
  assert.equal(previewMeterLevel(0.1), 2 / 3);
  assert.equal(previewMeterLevel(1), 1);
  assert.equal(previewMeterLevel(2), 1);
});

test('channel frames measure distinct waveforms and reset on pause, buffering and unavailable context', () => {
  const engine = new SoundEngine(null);
  engine.audioContext = { sampleRate: 48000, state: 'running' };
  engine.analyserNode = { fftSize: 2048, getByteFrequencyData: data => data.fill(0),
    getFloatTimeDomainData: data => data.set([0.25, -0.25]) };
  engine.frequencyData = new Uint8Array(1024);
  engine.timeDomainData = new Float32Array(2);
  engine.stereoAnalysers = [0.5, 0.125].map(amplitude => ({
    getFloatTimeDomainData: data => data.set([amplitude, -amplitude])
  }));
  engine.stereoTimeData = [new Float32Array(2), new Float32Array(2)];
  engine.isPlaying = true;
  engine.currentTrackId = 'different-stereo';
  engine.analyzeCurrentFrame();
  assert.equal(engine.lastAudioFrame.left, 0.5);
  assert.equal(engine.lastAudioFrame.right, 0.125);
  assert.equal(engine.lastAudioFrame.stereoAvailable, true);
  assert.equal(engine.lastAudioFrame.trackId, 'different-stereo');
  engine.stopAnalysisLoop();
  assert.equal(engine.lastAudioFrame.left, 0);
  assert.equal(engine.lastAudioFrame.right, 0);
  assert.equal(engine.lastAudioFrame.isResting, true);
  engine.isBuffering = true;
  engine.analyzeCurrentFrame();
  assert.equal(engine.lastAudioFrame.isBuffering, true);
  assert.equal(engine.lastAudioFrame.left, 0);
  engine.isBuffering = false;
  engine.audioContext.state = 'suspended';
  engine.analyzeCurrentFrame();
  assert.equal(engine.lastAudioFrame.left, 0);
  assert.equal(engine.lastAudioFrame.right, 0);
});

test('stereo analysis upmixes mono before splitting without adding an audible output or duplicate nodes', () => {
  const engine = new SoundEngine(null);
  const connections = [];
  const node = name => ({ name, fftSize: 1024, connect: (target, output) => connections.push([name, target.name, output]) });
  const input = node('stereo-input');
  const splitter = node('splitter');
  let analyserCount = 0;
  engine.analyserNode = node('main-analyser');
  engine.audioContext = {
    destination: node('audible-output'),
    createGain: () => input,
    createChannelSplitter: channels => { assert.equal(channels, 2); return splitter; },
    createAnalyser: () => node(`channel-${analyserCount++}`)
  };
  engine.initStereoAnalysis();
  assert.equal(input.channelCount, 2);
  assert.equal(input.channelCountMode, 'explicit');
  assert.equal(input.channelInterpretation, 'speakers');
  assert.deepEqual(connections, [
    ['splitter', 'channel-0', 0], ['splitter', 'channel-1', 1],
    ['stereo-input', 'splitter', undefined], ['main-analyser', 'stereo-input', undefined]
  ]);
  engine.initStereoAnalysis();
  assert.equal(connections.length, 4);
  assert.equal(analyserCount, 2);
});
