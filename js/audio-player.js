/**
 * Plays Spotify previews or verified Apple catalog matches, capped at 30 seconds.
 */

import { bandLevel, rmsLevel, PreviewTempoEstimator } from './audio-analysis.js';

function normalizeCatalogText(value) {
  return String(value || '').normalize('NFKD').replace(/\p{M}/gu, '')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function recordingTitle(value) {
  return normalizeCatalogText(String(value || '')
    .replace(/\s*[-(\[]\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?\s*[)\]]?\s*$/i, ''));
}

export function findMatchingPreview(results, trackName, artistName, durationMs) {
  const title = recordingTitle(trackName);
  const artist = normalizeCatalogText(artistName);
  if (!title || !artist) return null;
  return (Array.isArray(results) ? results : []).find(candidate => {
    if (!candidate) return false;
    if (recordingTitle(candidate.trackName) !== title
        || normalizeCatalogText(candidate.artistName) !== artist) return false;
    if (Number.isFinite(durationMs) && Number.isFinite(candidate.trackTimeMillis)
        && Math.abs(durationMs - candidate.trackTimeMillis) > 10000) return false;
    try {
      return new URL(candidate.previewUrl).protocol === 'https:';
    } catch {
      return false;
    }
  }) || null;
}

export class SoundEngine {
  constructor(audioElement = typeof Audio !== 'undefined' ? new Audio() : null) {
    this.audioElement = audioElement;
    if (this.audioElement) {
      this.audioElement.crossOrigin = 'anonymous';
    }
    this.audioContext = null;
    this.sourceNode = null;
    this.analyserNode = null;
    this.frequencyData = null;
    this.timeDomainData = null;
    this.analysisAnimId = null;
    this.onAudioFrameCallbacks = [];
    this.trackAcoustics = new Map();
    this.measuredBpm = null;
    this.tempoEstimator = new PreviewTempoEstimator();

    this.isPlaying = false;
    this.isPaused = false;
    this.isLoading = false;
    this.currentTrackId = null;
    this.currentTrack = null;
    this.synthInterval = null;
    this.synthSeedName = '';
    this.onStateChangeCallbacks = [];
    this.previewCache = new Map(); // cache query -> previewUrl
    this.playRequestId = 0;
    this.previewTimer = null;
    this.previewDurationMs = 30000;
    this.previewRemainingMs = this.previewDurationMs;
    this.previewStartedAt = 0;
    this.isStopping = false;

    this.audioElement?.addEventListener?.('ended', () => {
      this.stop();
    });

    this.audioElement?.addEventListener?.('pause', () => {
      if (this.audioElement.paused && !this.isStopping && !this.synthInterval && !this.isLoading && this.currentTrackId) {
        if (this.isPaused && !this.isPlaying) return;
        this.isPlaying = false;
        this.isPaused = true;
        this.stopAnalysisLoop();
        this.pausePreviewCountdown();
        this.notifyState();
      }
    });

    this.audioElement?.addEventListener?.('error', (e) => {
      console.warn('Audio playback error:', e);
      if (this.currentTrackId && !this.synthInterval) {
        this.reportPreviewUnavailable();
      }
    });
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(callback => callback !== cb);
    };
  }

  notifyState() {
    this.onStateChangeCallbacks.forEach(cb => cb({
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      isLoading: this.isLoading,
      currentTrackId: this.currentTrackId,
      currentTrack: this.currentTrack,
      previewError: this.previewError || ''
    }));
  }

  resetPreviewCountdown() {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewTimer = null;
    this.previewRemainingMs = this.previewDurationMs;
    this.previewStartedAt = 0;
  }

  schedulePreviewStop() {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    if (this.previewRemainingMs <= 0) {
      this.stop();
      return;
    }
    this.previewStartedAt = performance.now();
    this.previewTimer = setTimeout(() => {
      this.previewTimer = null;
      this.previewRemainingMs = 0;
      this.stop();
    }, this.previewRemainingMs);
  }

  pausePreviewCountdown() {
    if (!this.previewTimer) return;
    clearTimeout(this.previewTimer);
    this.previewTimer = null;
    const elapsed = Math.max(0, performance.now() - this.previewStartedAt);
    this.previewRemainingMs = Math.max(0, this.previewRemainingMs - elapsed);
    this.previewStartedAt = 0;
  }

  setPreviewStartPosition() {
    const duration = Number(this.audioElement.duration);
    if (!Number.isFinite(duration) || duration <= 35) return;

    const latestStart = Math.max(0, duration - (this.previewDurationMs / 1000));
    this.audioElement.currentTime = Math.min(latestStart, Math.max(15, duration * 0.25));
  }

  initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Initialize Web Audio API nodes for real-time acoustic analysis
   */
  initAudioAnalysis() {
    if (!this.audioElement || typeof window === 'undefined') return;
    this.initAudioContext();
    if (this.analyserNode || !this.audioContext) return;

    try {
      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.75;
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.timeDomainData = new Float32Array(this.analyserNode.fftSize);

      this.sourceNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    } catch (err) {
      console.warn('Web Audio analysis connection skipped:', err);
    }
  }

  startAnalysisLoop() {
    if (this.analysisAnimId) return;

    const tick = () => {
      if (!this.isPlaying) {
        this.analysisAnimId = null;
        return;
      }
      this.analyzeCurrentFrame();
      this.analysisAnimId = requestAnimationFrame(tick);
    };

    this.analysisAnimId = requestAnimationFrame(tick);
  }

  stopAnalysisLoop() {
    if (this.analysisAnimId) {
      cancelAnimationFrame(this.analysisAnimId);
      this.analysisAnimId = null;
    }
    this.emitAudioFrame({
      bass: 0,
      mid: 0,
      treble: 0,
      overall: 0,
      bpm: this.measuredBpm,
      isResting: true
    });
  }

  analyzeCurrentFrame() {
    if (!this.analyserNode || !this.frequencyData) {
      this.emitAudioFrame({ bass: 0, mid: 0, treble: 0, overall: 0, bpm: null, isResting: true });
      return;
    }

    this.analyserNode.getByteFrequencyData(this.frequencyData);
    this.analyserNode.getFloatTimeDomainData(this.timeDomainData);

    const sampleRate = this.audioContext.sampleRate;
    const fftSize = this.analyserNode.fftSize;
    const bass = bandLevel(this.frequencyData, sampleRate, fftSize, 40, 180);
    const mid = bandLevel(this.frequencyData, sampleRate, fftSize, 181, 4000);
    const treble = bandLevel(this.frequencyData, sampleRate, fftSize, 4001, 16000);
    const rms = rmsLevel(this.timeDomainData);
    this.measuredBpm = this.tempoEstimator.update(bass, performance.now());
    const levelPercent = Math.round(rms * 100);
    if (this.currentTrackId) {
      this.trackAcoustics.set(this.currentTrackId, {
        bpm: this.measuredBpm,
        levelPercent,
        measuredAt: Date.now(),
        method: 'preview-onset-estimate-and-rms-full-scale'
      });
    }

    this.emitAudioFrame({
      bass,
      mid,
      treble,
      overall: rms,
      bpm: this.measuredBpm,
      levelPercent
    });
  }

  onAudioFrame(callback) {
    this.onAudioFrameCallbacks.push(callback);
    return () => {
      this.onAudioFrameCallbacks = this.onAudioFrameCallbacks.filter(cb => cb !== callback);
    };
  }

  emitAudioFrame(frame) {
    for (let i = 0; i < this.onAudioFrameCallbacks.length; i++) {
      try {
        this.onAudioFrameCallbacks[i](frame);
      } catch (err) {
        // Safe callback execution
      }
    }
  }

  getTrackAcoustics(trackId) {
    return this.trackAcoustics.get(trackId) || null;
  }

  /**
   * Search public iTunes/Apple Music catalog for the real 30s studio preview
   */
  async resolveRealAudioPreview(trackName, artistName, durationMs) {
    const cacheKey = JSON.stringify([artistName, trackName, durationMs]);
    if (this.previewCache.has(cacheKey)) {
      return this.previewCache.get(cacheKey);
    }

    try {
      // Clean track name of remaster / deluxe suffixes for optimal search matching
      const cleanTrack = trackName
        .replace(/\(feat\..*?\)/gi, '')
        .replace(/-\s*remaster.*?$/gi, '')
        .replace(/\(.*remaster.*?\)/gi, '')
        .replace(/-\s*radio edit.*?$/gi, '')
        .trim();

      const query = `${artistName} ${cleanTrack}`.trim();
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`;
      
      const signal = typeof globalThis.AbortSignal?.timeout === 'function' ? AbortSignal.timeout(5000) : undefined;
      const res = await fetch(url, { signal });
      if (!res.ok) return null;
      
      const data = await res.json();
      const match = findMatchingPreview(data.results || [], trackName, artistName, durationMs);
      if (match) {
        const previewUrl = match.previewUrl;
        this.previewCache.set(cacheKey, previewUrl);
        return previewUrl;
      }
    } catch (err) {
      console.warn('Could not fetch external preview snippet:', err);
    }

    return null;
  }

  /**
   * Play track: Resolves real audio and streams
   */
  async playTrack(track, { restart = false } = {}) {
    if (!track?.id) return;

    if (!restart && this.currentTrackId === track.id) {
      if (this.isPlaying) {
        this.pause();
        return;
      }
      if (this.isPaused) {
        await this.resume();
        return;
      }
      if (this.isLoading) {
        this.stop();
        return;
      }
    }

    this.stop(false);
    this.resetPreviewCountdown();
    const requestId = ++this.playRequestId;
    this.currentTrackId = track.id;
    this.currentTrack = track;
    this.isPaused = false;
    this.isLoading = true;
    this.notifyState();

    let previewUrl = track.preview_url;

    if (!previewUrl) {
      let artist = '';
      if (Array.isArray(track.artists) && track.artists.length > 0) {
        const first = track.artists[0];
        artist = (typeof first === 'object' && first ? first.name : first) || '';
      } else if (track.artistName) {
        artist = track.artistName;
      }
      previewUrl = await this.resolveRealAudioPreview(track.name, artist, track.duration_ms);
      if (requestId !== this.playRequestId) return;
      if (previewUrl) {
        track.preview_url = previewUrl;
      }
    }

    if (previewUrl) {
      try {
        this.initAudioAnalysis();
        this.audioElement.src = previewUrl;
        this.audioElement.addEventListener('loadedmetadata', () => {
          if (requestId === this.playRequestId) this.setPreviewStartPosition();
        }, { once: true });
        await this.audioElement.play();
        if (requestId !== this.playRequestId) {
          if (!this.currentTrackId) {
            this.isStopping = true;
            this.audioElement.pause();
            this.isStopping = false;
          }
          return;
        }
        this.isLoading = false;
        this.isPlaying = true;
        this.isPaused = false;
        this.schedulePreviewStop();
        this.startAnalysisLoop();
        this.notifyState();
      } catch (err) {
        if (requestId !== this.playRequestId) return;
        if (!this.synthInterval) {
          console.warn('HTML5 Audio play failed:', err);
          this.reportPreviewUnavailable();
        }
      }
    } else {
      this.reportPreviewUnavailable();
    }
  }

  reportPreviewUnavailable() {
    this.stop(false);
    this.previewError = 'Preview unavailable. No verified audio preview could be played for this track.';
    this.notifyState();
  }

  pause() {
    if (!this.currentTrackId || !this.isPlaying) return;
    this.playRequestId += 1;

    this.pausePreviewCountdown();
    this.stopAnalysisLoop();
    this.isPlaying = false;
    this.isPaused = true;

    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    } else {
      this.isStopping = true;
      this.audioElement.pause();
      this.isStopping = false;
    }
    this.notifyState();
  }

  async resume() {
    if (!this.currentTrackId || !this.isPaused || this.previewRemainingMs <= 0) {
      if (this.previewRemainingMs <= 0) this.stop();
      return;
    }

    const requestId = ++this.playRequestId;
    this.isLoading = true;
    this.isPaused = false;
    this.notifyState();
    try {
      if (this.synthSeedName) {
        this.isLoading = false;
        this.isPlaying = true;
        this.isPaused = false;
        this.startSynthInterval(this.synthSeedName, true);
        this.startAnalysisLoop();
      } else {
        this.initAudioAnalysis();
        await this.audioElement.play();
        if (requestId !== this.playRequestId) {
          if (!this.currentTrackId) {
            this.isStopping = true;
            this.audioElement.pause();
            this.isStopping = false;
          }
          return;
        }
        this.isLoading = false;
        this.isPlaying = true;
        this.isPaused = false;
        this.startAnalysisLoop();
      }
      this.schedulePreviewStop();
      this.notifyState();
    } catch (err) {
      if (requestId !== this.playRequestId) return;
      console.warn('Could not resume audio preview:', err);
      this.isLoading = false;
      this.isPlaying = false;
      this.isPaused = true;
      this.stopAnalysisLoop();
      this.notifyState();
    }
  }

  /**
   * Generative pleasant musical chords if offline / no internet connection
   */
  playSynthesizedLoop(seedName = 'Music') {
    this.initAudioContext();
    this.isPlaying = true;
    this.isPaused = false;
    this.isLoading = false;
    this.synthSeedName = seedName;
    this.schedulePreviewStop();
    this.startAnalysisLoop();
    this.notifyState();

    this.startSynthInterval(seedName);
  }

  startSynthInterval(seedName = 'Music', isResume = false) {
    if (this.synthInterval) clearInterval(this.synthInterval);

    const charSum = seedName.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const rootNotes = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00];
    const root = rootNotes[charSum % rootNotes.length];

    const chordProgressions = [
      [root, root * 1.2, root * 1.5, root * 1.8],
      [root * 0.75, root * 0.9, root * 1.12, root * 1.34],
      [root * 0.89, root * 1.06, root * 1.33, root * 1.6],
      [root * 0.67, root * 0.8, root * 1.0, root * 1.2]
    ];

    let chordIdx = 0;
    const playChordStep = () => {
      if (!this.isPlaying) return;

      const chord = chordProgressions[chordIdx % chordProgressions.length];
      chordIdx++;
      const now = this.audioContext.currentTime;

      chord.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900 + (Math.sin(chordIdx) * 300), now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06 / (i + 1), now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        if (this.analyserNode) {
          try { gain.connect(this.analyserNode); } catch (e) {}
        }

        osc.start(now);
        osc.stop(now + 1.9);
      });

      if (chordIdx % 2 === 1) {
        const kickOsc = this.audioContext.createOscillator();
        const kickGain = this.audioContext.createGain();

        kickOsc.frequency.setValueAtTime(120, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

        kickGain.gain.setValueAtTime(0.2, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        kickOsc.connect(kickGain);
        kickGain.connect(this.audioContext.destination);
        if (this.analyserNode) {
          try { kickGain.connect(this.analyserNode); } catch (e) {}
        }

        kickOsc.start(now);
        kickOsc.stop(now + 0.35);
      }
    };

    if (!isResume || this.previewRemainingMs > 0) playChordStep();
    this.synthInterval = setInterval(playChordStep, 1800);
  }

  stop(shouldNotify = true) {
    this.previewError = '';
    this.playRequestId += 1;
    this.resetPreviewCountdown();
    this.measuredBpm = null;
    this.tempoEstimator.reset();
    this.stopAnalysisLoop();
    this.isStopping = true;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.removeAttribute('src');
    }
    this.isStopping = false;

    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }

    this.isPlaying = false;
    this.isPaused = false;
    this.isLoading = false;
    this.currentTrackId = null;
    this.currentTrack = null;
    this.synthSeedName = '';
    if (shouldNotify) this.notifyState();
  }
}

export const soundEngine = new SoundEngine();
