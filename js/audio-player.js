/**
 * Audio Player Engine with Web Audio API Synthesizer Fallback
 * Provides real 30s preview playback OR dynamic synthesized lofi/synthwave
 * audio loops when Spotify preview_url is not available.
 */

class SoundEngine {
  constructor() {
    this.audioElement = new Audio();
    this.audioContext = null;
    this.isPlaying = false;
    this.currentTrackId = null;
    this.synthInterval = null;
    this.onStateChangeCallbacks = [];

    this.audioElement.addEventListener('ended', () => {
      this.stop();
    });

    this.audioElement.addEventListener('pause', () => {
      if (!this.synthInterval) {
        this.isPlaying = false;
        this.notifyState();
      }
    });
  }

  onStateChange(cb) {
    this.onStateChangeCallbacks.push(cb);
  }

  notifyState() {
    this.onStateChangeCallbacks.forEach(cb => cb({
      isPlaying: this.isPlaying,
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

  playTrack(track) {
    if (this.currentTrackId === track.id && this.isPlaying) {
      this.stop();
      return;
    }

    this.stop();
    this.currentTrackId = track.id;

    if (track.preview_url) {
      this.audioElement.src = track.preview_url;
      this.audioElement.play()
        .then(() => {
          this.isPlaying = true;
          this.notifyState();
        })
        .catch(() => {
          this.playSynthesizedLoop(track.name);
        });
    } else {
      this.playSynthesizedLoop(track.name);
    }
  }

  /**
   * Generates a pleasant generative synth & beat chord progression using Web Audio API
   */
  playSynthesizedLoop(seedName = 'Music') {
    this.initAudioContext();
    this.isPlaying = true;
    this.notifyState();

    // Determine musical key based on track name
    const charSum = seedName.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const rootNotes = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00]; // A, B, C, D, E, F, G
    const root = rootNotes[charSum % rootNotes.length];

    // Chords: root, minor/major 3rd, 5th, 7th
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

      // Play soft synth pad
      chord.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Lowpass filter for smooth vintage warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900 + (Math.sin(chordIdx) * 300), now);

        // Envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06 / (i + 1), now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start(now);
        osc.stop(now + 1.9);
      });

      // Play subtle vinyl sub beat
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

    // First chord immediately
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
    this.currentTrackId = null;
    this.notifyState();
  }
}

export const soundEngine = new SoundEngine();
