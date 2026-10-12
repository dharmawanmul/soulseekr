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
    this.isLoading = false;
    this.currentTrackId = null;
    this.synthInterval = null;
    this.onStateChangeCallbacks = [];
    this.previewCache = new Map(); // cache query -> previewUrl

    this.audioElement.addEventListener('ended', () => {
      this.stop();
    });

    this.audioElement.addEventListener('pause', () => {
      if (!this.synthInterval && !this.isLoading) {
        this.isPlaying = false;
        this.notifyState();
      }
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback error, falling back to synth:', e);
      if (this.currentTrackId) {
        this.playSynthesizedLoop('Synth Fallback');
      }
    });
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
  }

  notifyState() {
    this.onStateChangeCallbacks.forEach(cb => cb({
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      currentTrackId: this.currentTrackId
    }));
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
  async playTrack(track) {
    if (this.currentTrackId === track.id && this.isPlaying) {
      this.stop();
      return;
    }

    this.stop();
    this.currentTrackId = track.id;
    this.isLoading = true;
    this.notifyState();

    let previewUrl = track.preview_url;

    // If Spotify didn't provide a preview_url (or in demo mode), resolve genuine 30s audio
    if (!previewUrl) {
      const artist = (track.artists && track.artists[0]) ? track.artists[0].name : '';
      previewUrl = await this.resolveRealAudioPreview(track.name, artist);
      if (previewUrl) {
        track.preview_url = previewUrl; // cache on object
      }
    }

    this.isLoading = false;

    if (previewUrl) {
      try {
        this.audioElement.src = previewUrl;
        await this.audioElement.play();
        this.isPlaying = true;
        this.notifyState();
      } catch (err) {
        console.warn('HTML5 Audio play failed, starting generative synth:', err);
        this.playSynthesizedLoop(track.name);
      }
    } else {
      // Fallback only if no preview exists anywhere
      this.playSynthesizedLoop(track.name);
    }
  }

  /**
   * Generative pleasant musical chords if offline / no internet connection
   */
  playSynthesizedLoop(seedName = 'Music') {
    this.initAudioContext();
    this.isPlaying = true;
    this.isLoading = false;
    this.notifyState();

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

    playChordStep();
    this.synthInterval = setInterval(playChordStep, 1800);
  }

  stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;

    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }

    this.isPlaying = false;
    this.isLoading = false;
    this.currentTrackId = null;
    this.notifyState();
  }
}

export const soundEngine = new SoundEngine();
