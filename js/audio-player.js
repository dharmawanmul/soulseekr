/**
 * Audio Player Engine with Real 30-Second Studio Audio Preview Matcher
 * & Web Audio API Generative Fallback
 *
 * 1. Checks for native Spotify preview_url
 * 2. If null (as Spotify now does for most tracks), queries the public Apple Music / iTunes
 *    search API to stream the REAL 30s studio master audio preview of that exact track!
 * 3. Falls back to generative Web Audio synth loops if offline.
 */

class SoundEngine {
  constructor() {
    this.audioElement = new Audio();
    this.audioContext = null;
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

    this.audioElement.addEventListener('ended', () => {
      this.stop();
    });

    this.audioElement.addEventListener('pause', () => {
      if (!this.isStopping && !this.synthInterval && !this.isLoading && this.currentTrackId) {
        if (this.isPaused && !this.isPlaying) return;
        this.isPlaying = false;
        this.isPaused = true;
        this.pausePreviewCountdown();
        this.notifyState();
      }
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error, falling back to synth:', e);
      if (this.currentTrackId && !this.synthInterval) {
        this.playSynthesizedLoop('Synth Fallback');
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
      currentTrack: this.currentTrack
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
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Search public iTunes/Apple Music catalog for the real 30s studio preview
   */
  async resolveRealAudioPreview(trackName, artistName) {
    const cacheKey = `${artistName} - ${trackName}`.toLowerCase().trim();
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
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
      
      const res = await fetch(url);
      if (!res.ok) return null;
      
      const data = await res.json();
      if (data.results && data.results.length > 0 && data.results[0].previewUrl) {
        const previewUrl = data.results[0].previewUrl;
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
      const artist = (track.artists && track.artists[0]) ? track.artists[0].name : '';
      previewUrl = await this.resolveRealAudioPreview(track.name, artist);
      if (requestId !== this.playRequestId) return;
      if (previewUrl) {
        track.preview_url = previewUrl;
      }
    }

    this.isLoading = false;

    if (previewUrl) {
      try {
        this.audioElement.src = previewUrl;
        this.audioElement.addEventListener('loadedmetadata', () => {
          if (requestId === this.playRequestId) this.setPreviewStartPosition();
        }, { once: true });
        await this.audioElement.play();
        if (requestId !== this.playRequestId) {
          this.isStopping = true;
          this.audioElement.pause();
          this.isStopping = false;
          return;
        }
        this.isPlaying = true;
        this.isPaused = false;
        this.schedulePreviewStop();
        this.notifyState();
      } catch (err) {
        if (requestId !== this.playRequestId) return;
        if (!this.synthInterval) {
          console.warn('HTML5 Audio play failed, starting generative synth:', err);
          this.playSynthesizedLoop(track.name);
        }
      }
    } else {
      this.playSynthesizedLoop(track.name);
    }
  }

  pause() {
    if (!this.currentTrackId || !this.isPlaying) return;

    this.pausePreviewCountdown();
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

    try {
      if (this.synthSeedName) {
        this.isPlaying = true;
        this.isPaused = false;
        this.startSynthInterval(this.synthSeedName, true);
      } else {
        await this.audioElement.play();
        this.isPlaying = true;
        this.isPaused = false;
      }
      this.schedulePreviewStop();
      this.notifyState();
    } catch (err) {
      console.warn('Could not resume audio preview:', err);
      this.isPlaying = false;
      this.isPaused = true;
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

        kickOsc.start(now);
        kickOsc.stop(now + 0.35);
      }
    };

    if (!isResume || this.previewRemainingMs > 0) playChordStep();
    this.synthInterval = setInterval(playChordStep, 1800);
  }

  stop(shouldNotify = true) {
    this.playRequestId += 1;
    this.resetPreviewCountdown();
    this.isStopping = true;
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.audioElement.removeAttribute('src');
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
