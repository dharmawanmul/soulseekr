/**
 * Soulseekr interactive listening story.
 */

import { soundEngine } from './audio-player.js';
import { exportCardAsImage, downloadDataUrl, copyCardToClipboard } from './exporter.js';
import { showToast } from './app.js';
import { escapeHtml } from './card-renderer.js';

const SLIDE_THEMES = [
  { primary: '#ed6a45', secondary: '#d8c9aa', threeColors: [0xed6a45, 0xd8c9aa] },
  { primary: '#8aa29b', secondary: '#ed6a45', threeColors: [0x8aa29b, 0xed6a45] },
  { primary: '#d8c9aa', secondary: '#8aa29b', threeColors: [0xd8c9aa, 0x8aa29b] },
  { primary: '#ed6a45', secondary: '#8aa29b', threeColors: [0xed6a45, 0x8aa29b] },
  { primary: '#8aa29b', secondary: '#d8c9aa', threeColors: [0x8aa29b, 0xd8c9aa] },
  { primary: '#d8c9aa', secondary: '#ed6a45', threeColors: [0xd8c9aa, 0xed6a45] }
];

/**
 * Three.js WebGL 3D Background Particle & Crystal Visualizer
 */
class ThreeWrappedVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.particles = null;
    this.particleCount = 1400;
    this.crystal = null;
    this.animId = null;
    this.clock = null;
    this.isRunning = false;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.currentSlide = 0;
    this.colorProgress = 1.0;
    this.activeColor1 = new (window.THREE ? THREE.Color : Object)(0xed6a45);
    this.activeColor2 = new (window.THREE ? THREE.Color : Object)(0xd8c9aa);
    this.targetColor1 = new (window.THREE ? THREE.Color : Object)(0xed6a45);
    this.targetColor2 = new (window.THREE ? THREE.Color : Object)(0xd8c9aa);

    this.onResize = this.handleResize.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
  }

  init() {
    if (typeof window.THREE === 'undefined') {
      console.warn('Three.js not loaded, skipping 3D canvas');
      return false;
    }

    try {
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.z = 28;

      const contextOptions = {
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      };
      const context = this.canvas.getContext('webgl2', contextOptions)
        || this.canvas.getContext('webgl', contextOptions);
      if (!context) {
        console.warn('WebGL is unavailable, continuing without the 3D background');
        return false;
      }

      this.renderer = new THREE.WebGLRenderer({
        ...contextOptions,
        canvas: this.canvas,
        context
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.clock = new THREE.Clock();

      // Create Particle Swarm
      this.createParticles();

      // Create Center Floating Geometric Crystal
      this.createCrystal();

      window.addEventListener('resize', this.onResize);
      window.addEventListener('mousemove', this.onMouseMove);

      return true;
    } catch (err) {
      console.warn('WebGL init error:', err);
      return false;
    }
  }

  createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const scales = new Float32Array(this.particleCount);

    const c1 = this.activeColor1;
    const c2 = this.activeColor2;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      // Cylindrical / torus cosmic field distribution
      const theta = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 22;
      positions[i3] = Math.cos(theta) * radius + (Math.random() - 0.5) * 6;
      positions[i3 + 1] = (Math.random() - 0.5) * 36;
      positions[i3 + 2] = Math.sin(theta) * radius + (Math.random() - 0.5) * 10;

      // Color gradient
      const ratio = Math.random();
      const col = c1.clone().lerp(c2, ratio);
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      scales[i] = 0.8 + Math.random() * 2.2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Material
    const material = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createCrystal() {
    const icosaGeometry = new THREE.IcosahedronGeometry(7, 1);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });

    this.crystal = new THREE.Mesh(icosaGeometry, wireframeMat);
    this.scene.add(this.crystal);
  }

  setSlide(slideIndex) {
    this.currentSlide = slideIndex;
    const theme = SLIDE_THEMES[slideIndex] || SLIDE_THEMES[0];
    if (window.THREE) {
      this.targetColor1 = new THREE.Color(theme.threeColors[0]);
      this.targetColor2 = new THREE.Color(theme.threeColors[1]);
      this.colorProgress = 0;
    }
  }

  handleMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    this.mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  handleResize() {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  animate() {
    if (!this.isRunning) return;
    this.animId = requestAnimationFrame(this.animate.bind(this));

    const time = this.clock ? this.clock.getElapsedTime() : 0;

    // Smooth camera mouse parallax
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    if (this.camera) {
      this.camera.position.x = this.mouse.x * 3.5;
      this.camera.position.y = -this.mouse.y * 2.5;
      this.camera.lookAt(0, 0, 0);
    }

    // Color transition interpolation
    if (this.colorProgress < 1.0) {
      this.colorProgress += 0.03;
      this.activeColor1.lerp(this.targetColor1, 0.05);
      this.activeColor2.lerp(this.targetColor2, 0.05);

      if (this.particles && this.particles.geometry.attributes.color) {
        const colors = this.particles.geometry.attributes.color.array;
        for (let i = 0; i < this.particleCount; i++) {
          const i3 = i * 3;
          const ratio = (Math.sin(i * 0.1 + time) + 1) * 0.5;
          const col = this.activeColor1.clone().lerp(this.activeColor2, ratio);
          colors[i3] = col.r;
          colors[i3 + 1] = col.g;
          colors[i3 + 2] = col.b;
        }
        this.particles.geometry.attributes.color.needsUpdate = true;
      }
    }

    // Particle Wave Animation
    if (this.particles) {
      this.particles.rotation.y = time * 0.08;
      this.particles.rotation.x = Math.sin(time * 0.05) * 0.12;

      const positions = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3;
        const u = positions[i3];
        const v = positions[i3 + 2];
        positions[i3 + 1] += Math.sin(time * 1.5 + u * 0.2 + v * 0.2) * 0.04;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Crystal Rotation
    if (this.crystal) {
      this.crystal.rotation.x = time * 0.25;
      this.crystal.rotation.y = time * 0.35;
      const scale = 1 + Math.sin(time * 2.2) * 0.06;
      this.crystal.scale.set(scale, scale, scale);
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}

/**
 * Story Controller Engine
 */
export class WrappedExperience {
  constructor() {
    this.modal = document.getElementById('wrapped-modal');
    this.canvas = document.getElementById('wrapped-three-canvas');
    this.viewport = document.getElementById('wrapped-slides-viewport');
    this.progressTrack = document.getElementById('wrapped-progress-track');
    this.glowBg = document.getElementById('wrapped-stage-glow');
    
    // Top Bar elements
    this.userAvatar = document.getElementById('wrapped-user-avatar');
    this.userName = document.getElementById('wrapped-user-name');
    this.userTag = document.getElementById('wrapped-user-tag');
    this.soundtrackCue = document.getElementById('wrapped-soundtrack-cue');
    this.soundtrackIndex = document.getElementById('wrapped-soundtrack-index');
    this.soundtrackTitle = document.getElementById('wrapped-soundtrack-title');
    this.btnMute = document.getElementById('btn-wrapped-mute');
    this.btnClose = document.getElementById('btn-wrapped-close');

    // Controls
    this.tapLeft = document.getElementById('wrapped-tap-left');
    this.tapRight = document.getElementById('wrapped-tap-right');
    this.btnPrev = document.getElementById('wrapped-nav-prev');
    this.btnNext = document.getElementById('wrapped-nav-next');

    this.visualizer = null;
    this.currentSlideIndex = 0;
    this.totalSlides = 6;
    this.slideDurationMs = 7500; // 7.5s per slide
    this.progressStartTime = null;
    this.progressAnimId = null;
    this.isPaused = false;
    this.isMuted = false;
    this.data = null;
    this.timeRange = 'short_term';
    this.slideTracks = [];
    this.returnFocus = null;

    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onWheel = this.handleWheel.bind(this);
    this.lastWheelTime = 0;
    this.unsubscribeSoundState = soundEngine.onStateChange(state => this.updatePlaybackUi(state));
    this.setupListeners();
  }

  setupListeners() {
    // Tap zones
    this.tapLeft?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prevSlide();
    });

    this.tapRight?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextSlide();
    });

    this.btnPrev?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prevSlide();
    });

    this.btnNext?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.nextSlide();
    });

    this.btnClose?.addEventListener('click', () => {
      this.close();
    });

    this.btnMute?.addEventListener('click', () => {
      this.toggleMute();
    });

    // Hold to pause (like Instagram / Spotify stories)
    const stage = document.querySelector('.wrapped-stage');
    if (stage) {
      stage.addEventListener('pointerdown', (e) => {
        // don't pause if clicking on interactive buttons
        if (e.target.closest('button') || e.target.closest('.ladder-item') || e.target.closest('.top-track-hero')) return;
        this.pauseProgress();
      });

      stage.addEventListener('pointerup', () => {
        this.resumeProgress();
      });

      stage.addEventListener('pointerleave', () => {
        this.resumeProgress();
      });
    }
  }

  handleKeyDown(e) {
    if (!this.modal.classList.contains('is-open')) return;

    if (e.key === 'Tab') {
      const focusable = [...this.modal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')]
        .filter(element => {
          const slide = element.closest('.wrapped-slide');
          return !element.disabled && (!slide || slide.classList.contains('is-active'));
        });
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }

    const isInteractive = e.target.closest('button, [role="button"], a');
    if (e.key === 'ArrowRight' || ((e.key === ' ' || e.key === 'Space') && !isInteractive)) {
      e.preventDefault();
      this.nextSlide();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prevSlide();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    }
  }

  handleWheel(e) {
    if (!this.modal.classList.contains('is-open')) return;
    e.preventDefault();
    const now = Date.now();
    if (this.lastWheelTime && now - this.lastWheelTime < 450) return;
    if (Math.abs(e.deltaY) < 15) return;
    this.lastWheelTime = now;
    if (e.deltaY > 0) {
      this.nextSlide();
    } else {
      this.prevSlide();
    }
  }

  open(data, timeRange = 'short_term') {
    if (!Array.isArray(data?.topTracks) || data.topTracks.length === 0) return;
    this.returnFocus = document.activeElement;
    this.data = data;
    this.timeRange = timeRange;
    this.slideTracks = this.selectDistinctSlideTracks(data.topTracks || []);

    // Populate Top Bar
    const user = data.user || {};
    if (this.userName) this.userName.textContent = user.display_name || user.id || '';
    if (this.userAvatar) {
      const avatarUrl = user.images && user.images[0]?.url;
      if (avatarUrl) {
        this.userAvatar.src = avatarUrl;
      } else {
        this.userAvatar.removeAttribute('src');
      }
    }
    if (this.userTag) {
      const rangeText = timeRange === 'long_term' ? 'All Time' : timeRange === 'medium_term' ? '6 Months' : '4 Weeks';
      this.userTag.textContent = `2026 Archive • ${rangeText}`;
    }

    // Render All Slides Content
    this.renderSlides();

    // Setup Progress Bar Segments
    this.setupProgressBar();

    // Open Modal
    this.modal.classList.add('is-open');
    this.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('wheel', this.onWheel, { passive: false });

    // Initialize 3D Three.js Visualizer
    if (!this.visualizer && this.canvas) {
      this.visualizer = new ThreeWrappedVisualizer(this.canvas);
      this.visualizer.init();
    }
    if (this.visualizer) {
      this.visualizer.start();
    }

    // Go to first slide
    this.goToSlide(0);
    requestAnimationFrame(() => this.btnClose?.focus());

  }

  close() {
    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('wheel', this.onWheel);
    this.stopProgress();

    if (this.visualizer) {
      this.visualizer.stop();
    }

    // Stop sound if playing
    soundEngine.stop();
    if (this.returnFocus instanceof HTMLElement) this.returnFocus.focus();
    this.returnFocus = null;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.btnMute) {
      this.btnMute.innerHTML = this.isMuted 
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
      this.btnMute.title = this.isMuted ? 'Unmute Audio' : 'Mute Audio';
      this.btnMute.setAttribute('aria-label', this.isMuted ? 'Unmute audio' : 'Mute audio');
    }

    if (this.isMuted) {
      soundEngine.stop();
      showToast('Wrapped Audio Muted', 'info', 1500);
    } else {
      this.playSlideAudio();
      showToast('Wrapped Audio Unmuted', 'info', 1500);
    }
  }

  selectDistinctSlideTracks(tracks) {
    const seen = new Set();
    const pool = tracks.slice(0, 50).filter(track => {
      const key = track?.id || `${track?.name || ''}:${track?.artists?.[0]?.name || ''}`;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Shuffle the user's full top-50 pool once per opening, then assign without replacement.
    for (let index = pool.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
    }

    return pool.slice(0, this.totalSlides);
  }

  async playSlideAudio(slideIndex = this.currentSlideIndex) {
    if (!this.data || !this.data.topTracks || !this.data.topTracks.length) return;
    const storyTrack = this.slideTracks[slideIndex];
    if (this.soundtrackIndex) {
      this.soundtrackIndex.textContent = storyTrack
        ? `Story ${slideIndex + 1} soundtrack`
        : `Story ${slideIndex + 1} soundtrack unavailable`;
    }
    if (this.soundtrackTitle) {
      const artistName = storyTrack?.artists?.[0]?.name || storyTrack?.artistName || '';
      this.soundtrackTitle.textContent = storyTrack
        ? `${storyTrack.name}${artistName ? ` / ${artistName}` : ''}`
        : 'No additional unique track was returned';
    }
    if (this.soundtrackCue) {
      this.soundtrackCue.classList.toggle('is-unavailable', !storyTrack);
    }

    if (this.isMuted) return;

    if (storyTrack) {
      try {
        await soundEngine.playTrack(storyTrack, { restart: true });
      } catch (err) {
        console.warn('Could not play this story soundtrack:', err);
      }
    } else {
      soundEngine.stop();
    }
  }

  setupProgressBar() {
    if (!this.progressTrack) return;
    this.progressTrack.innerHTML = '';
    for (let i = 0; i < this.totalSlides; i++) {
      const seg = document.createElement('button');
      seg.type = 'button';
      seg.className = 'wrapped-seg';
      seg.setAttribute('data-index', i);
      seg.setAttribute('aria-label', `Go to story ${i + 1} of ${this.totalSlides}`);
      const fill = document.createElement('span');
      fill.className = 'wrapped-seg-fill';
      seg.appendChild(fill);

      seg.addEventListener('click', (e) => {
        e.stopPropagation();
        this.goToSlide(i);
      });

      this.progressTrack.appendChild(seg);
    }
  }

  renderSlides() {
    const data = this.data;
    const stats = data.stats || {};
    const tracks = data.topTracks || [];
    const artists = data.topArtists || [];
    const albums = data.topAlbums || [];
    const genres = data.topGenres || [];
    const hasGenreData = genres.length > 0;
    const genreFallbackArtists = artists.slice(0, 5);
    const windowLabel = this.timeRange === 'long_term'
      ? 'About 1 year'
      : this.timeRange === 'medium_term'
        ? 'About 6 months'
        : 'About 4 weeks';

    const topTrack = tracks[0];
    const topAlbum = albums[0] || null;
    const userImg = data.user?.images?.[0]?.url || '';
    const profileName = data.user?.display_name || data.user?.id || '';
    const userInitial = profileName.trim().charAt(0).toUpperCase();
    const avatarMarkup = userImg
      ? `<img class="prologue-avatar-img" src="${escapeHtml(userImg)}" alt="Spotify profile">`
      : userInitial ? `<span class="prologue-avatar-img avatar-initial" aria-hidden="true">${escapeHtml(userInitial)}</span>` : '';
    const rankedTrackMinutes = Number.isFinite(Number(stats.rankedTrackMinutes))
      ? Number(stats.rankedTrackMinutes)
      : Math.round(tracks.reduce((total, track) => total + (Number(track.duration_ms) || 0), 0) / 60000);
    const averageTrackSeconds = tracks.length
      ? Math.round(tracks.reduce((total, track) => total + (Number(track.duration_ms) || 0), 0) / tracks.length / 1000)
      : null;
    const averageTrackLength = averageTrackSeconds === null
      ? 'Not available'
      : `${Math.floor(averageTrackSeconds / 60)}:${String(averageTrackSeconds % 60).padStart(2, '0')}`;
    const energy = Number.isFinite(stats.energyScore) ? stats.energyScore : null;
    const dance = Number.isFinite(stats.danceScore) ? stats.danceScore : null;
    const obscurity = Number.isFinite(stats.obscurityScore) ? stats.obscurityScore : null;

    this.viewport.innerHTML = `
      <!-- Slide 0: Prologue / Cosmic Identity -->
      <div class="wrapped-slide" data-slide="0">
        <div>
          <span class="slide-eyebrow">Listening archive / ${windowLabel}</span>
          <h2 class="slide-title">Your Year in Music</h2>
          <p class="slide-desc">The artists, albums, and patterns that stayed in rotation.</p>
        </div>

        <div class="prologue-center">
          <div class="prologue-avatar-orb">
            ${avatarMarkup}
          </div>
          <div class="prologue-stat-box">
            <span class="prologue-big-number">${tracks.length}</span>
            <span class="prologue-stat-label">Ranked tracks examined</span>
          </div>
          ${stats.vibeLabel ? `<div class="prologue-vibe-pill">${escapeHtml(stats.vibeLabel)}</div>` : ''}
        </div>

        <div class="prologue-prompt">
          Tap the right side or press Space to continue
        </div>
      </div>

      <!-- Slide 1: Top 5 Tracks (The Anthems) -->
      <div class="wrapped-slide" data-slide="1">
        <div>
          <span class="slide-eyebrow">Spotify affinity / Tracks</span>
          <h2 class="slide-title">Kept in Rotation</h2>
          <p class="slide-desc">Your highest-ranked tracks in this Spotify window.</p>
        </div>

        <!-- #1 Hero Track Card -->
        <div class="top-track-hero" id="wrapped-hero-track-btn" data-track-id="${topTrack.id || ''}">
          <div class="top-track-vinyl-wrapper">
            <img class="top-track-art" src="${topTrack.album?.images?.[0]?.url || ''}" alt="Cover">
            <div class="top-track-vinyl"></div>
          </div>
          <div class="top-track-info">
            <span class="top-track-badge">01 / Highest affinity</span>
            <span class="top-track-name">${topTrack.name}</span>
            <span class="top-track-artist">${Array.isArray(topTrack.artists) ? topTrack.artists.map(a => (a && typeof a === 'object' ? a.name : a) || '').filter(Boolean).join(', ') : (topTrack.artistName || 'Unknown Artist')}</span>
            <span class="top-track-play-btn">Play preview</span>
          </div>
        </div>

        <!-- Tracks #2 - #5 Ladder -->
        <div class="tracks-ladder">
          ${tracks.slice(1, 5).map((track, i) => `
            <div class="ladder-item track-play-trigger" data-track-id="${track.id || ''}">
              <span class="ladder-rank">0${i + 2}</span>
              <img class="ladder-thumb" src="${track.album?.images?.[0]?.url || ''}" alt="art">
              <div class="ladder-meta">
                <span class="ladder-title">${track.name}</span>
                <span class="ladder-artist">${Array.isArray(track.artists) ? track.artists.map(a => (a && typeof a === 'object' ? a.name : a) || '').filter(Boolean).join(', ') : (track.artistName || 'Unknown Artist')}</span>
              </div>
              <span class="ladder-play-state" aria-hidden="true">▶</span>
            </div>
          `).join('')}
        </div>

        <div style="font-size:0.675rem; color:rgba(255,255,255,0.68); text-align:center;">
          Tap any track to preview audio
        </div>
      </div>

      <!-- Slide 2: Top 5 Albums (Heavy Rotations) -->
      <div class="wrapped-slide" data-slide="2">
        <div>
          <span class="slide-eyebrow">Derived from ranked tracks / Albums</span>
          <h2 class="slide-title">Top 5 Albums</h2>
          <p class="slide-desc">Albums appearing most often inside the ranked track set.</p>
        </div>

        <!-- #1 Hero Album Card -->
        <div class="album-hero">
          ${topAlbum?.images?.[0]?.url ? `<img class="album-hero-bg" src="${escapeHtml(topAlbum.images[0].url)}" alt="Album">` : ''}
          <div class="album-hero-scrim"></div>
          <div class="album-hero-content">
            <span class="album-crown-tag">${topAlbum ? `01 / Album${topAlbum.releaseYear ? ` / ${topAlbum.releaseYear}` : ''}` : 'Album data unavailable'}</span>
            ${topAlbum ? `<span class="album-hero-name">${escapeHtml(topAlbum.name)}</span><span class="album-hero-artist">${escapeHtml(topAlbum.artistName || topAlbum.artists?.[0]?.name || '')}</span>` : ''}
          </div>
        </div>

        <!-- Albums #2 - #5 Grid -->
        <div class="album-grid">
          ${albums.slice(1, 5).map(album => `
            <div class="album-mini-card">
              <img class="album-mini-art" src="${album.images?.[0]?.url || ''}" alt="Cover">
              <div class="album-mini-info">
                <span class="album-mini-title">${album.name}</span>
                <span class="album-mini-artist">${album.artistName || album.artists?.[0]?.name || ''}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="font-size:0.675rem; color:rgba(255,255,255,0.68); text-align:center;">
          Ordered from your listening history
        </div>
      </div>

      <!-- Slide 3: Minutes & Sonic DNA -->
      <div class="wrapped-slide" data-slide="3">
        <div>
          <span class="slide-eyebrow">Listening profile / Local reading</span>
          <h2 class="slide-title">The Shape of Your Listening</h2>
          <p class="slide-desc">Direct catalog fields alongside clearly marked Soulseekr interpretations.</p>
        </div>

        <div class="minutes-hero-block">
          <span class="minutes-counter">${rankedTrackMinutes.toLocaleString()}</span>
          <span class="minutes-subtext">Combined minutes across returned ranked tracks</span>
        </div>

        <div class="mini-eq-bars">
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
          <span class="eq-bar"></span>
        </div>

        <div class="metrics-bento">
          <div class="metric-bento-card">
            <span class="metric-bento-label">Average track length</span>
            <span class="metric-bento-val">${averageTrackLength}</span>
            <div class="metric-bento-bar"><div class="metric-bento-fill" style="width: ${averageTrackSeconds === null ? 0 : Math.min(100, averageTrackSeconds / 4)}%"></div></div>
          </div>
          <div class="metric-bento-card">
            <span class="metric-bento-label">Energy interpretation</span>
            <span class="metric-bento-val">${energy === null ? 'Not available' : `${energy}%`}</span>
            <div class="metric-bento-bar"><div class="metric-bento-fill" style="width: ${energy ?? 0}%"></div></div>
          </div>
          <div class="metric-bento-card">
            <span class="metric-bento-label">Movement interpretation</span>
            <span class="metric-bento-val">${dance === null ? 'Not available' : `${dance}%`}</span>
            <div class="metric-bento-bar"><div class="metric-bento-fill" style="width: ${dance ?? 0}%"></div></div>
          </div>
          <div class="metric-bento-card">
            <span class="metric-bento-label">Obscurity score</span>
            <span class="metric-bento-val">${obscurity === null ? 'Not available' : `${obscurity}%`}</span>
            <div class="metric-bento-bar"><div class="metric-bento-fill" style="width: ${obscurity ?? 0}%"></div></div>
          </div>
        </div>
      </div>

      <!-- Slide 4: Genre Mix or Ranked-Artist Fallback & Sonic Aura -->
      <div class="wrapped-slide" data-slide="4">
        <div>
          <span class="slide-eyebrow">Listening profile / ${hasGenreData ? 'Genres' : 'Artist signals'}</span>
          <h2 class="slide-title">${hasGenreData ? 'Top 5 Genres' : 'Top 5 Artists'}</h2>
          <p class="slide-desc">${hasGenreData
            ? 'The genre mix attached to your affinity-ranked artists.'
            : 'Spotify did not provide genre tags, so your ranked artists are shown instead.'}</p>
        </div>

        <div class="genres-stack">
          ${genres.length ? genres.slice(0, 5).map(genre => `
            <div class="genre-bar-item">
              <div class="genre-bar-header">
                <span>${genre.name}</span>
                <span class="genre-bar-pct">${genre.percentage}%</span>
              </div>
              <div class="genre-bar-track">
                <div class="genre-bar-fill" style="width: ${genre.percentage}%"></div>
              </div>
            </div>
          `).join('') : genreFallbackArtists.length ? `
            <div class="genre-data-note" role="status">
              Genre metadata is unavailable for this window. No genre labels were inferred.
            </div>
            <ol class="genre-artist-fallback">
              ${genreFallbackArtists.map((artist, index) => {
                const imageUrl = artist?.images?.find(image => image?.url)?.url || '';
                const initial = (artist?.name || 'Artist').trim().charAt(0).toUpperCase();
                return `
                  <li>
                    <span class="genre-artist-rank">${String(index + 1).padStart(2, '0')}</span>
                    ${imageUrl
                      ? `<img src="${escapeHtml(imageUrl)}" alt="" class="genre-artist-image">`
                      : `<span class="genre-artist-image genre-artist-initial" aria-hidden="true">${escapeHtml(initial)}</span>`}
                    <strong>${escapeHtml(artist?.name || 'Unknown artist')}</strong>
                    <span class="genre-artist-source">Spotify rank</span>
                  </li>
                `;
              }).join('')}
            </ol>
          ` : `
            <div class="wrapped-data-empty" role="status">
              Spotify returned neither genre tags nor ranked artists for this window.
            </div>
          `}
        </div>

        <div class="aura-card-box">
          <div class="aura-orb-sphere"></div>
          <div class="aura-card-text">
            ${stats.auraTitle ? `<span class="aura-card-title">${escapeHtml(stats.auraTitle)}</span>` : ''}
            <span class="aura-card-desc">${[stats.obscurityTier, hasGenreData ? stats.dominantGenre : null].filter(Boolean).map(escapeHtml).join(' • ') || 'No interpretive label added'}</span>
          </div>
        </div>
      </div>

      <!-- Slide 5: Master Recap Archive Card -->
      <div class="wrapped-slide" data-slide="5">
        <div>
          <span class="slide-eyebrow">Archive card / ${windowLabel}</span>
          <h2 class="slide-title">Your Listening Archive</h2>
          <p class="slide-desc">A compact record of the music you kept close.</p>
        </div>

        <!-- Master Recap Artifact Container (Exportable) -->
        <div class="recap-card-artifact" id="wrapped-recap-export-card">
          <div class="recap-artifact-header">
            <span class="recap-brand">SOULSEEKR // ARCHIVE</span>
            <span class="recap-year-pill">${windowLabel} archive</span>
          </div>

          <div style="display:flex; align-items:center; gap:0.75rem;">
            ${userImg
              ? `<img class="recap-avatar" src="${escapeHtml(userImg)}" alt="Spotify profile">`
              : `<span class="recap-avatar avatar-initial" aria-hidden="true">${escapeHtml(userInitial)}</span>`}
            <div>
              <div style="font-size:0.95rem; font-weight:800; color:#fff;">${escapeHtml(profileName || 'Spotify archive')}</div>
              ${stats.vibeLabel ? `<div style="font-size:0.7rem; color:rgba(255,255,255,0.6);">${escapeHtml(stats.vibeLabel)}</div>` : ''}
            </div>
          </div>

          <div class="recap-summary-grid">
            <div class="recap-summary-item">
              <span class="recap-item-label">Top Track</span>
              <span class="recap-item-val">${escapeHtml(topTrack.name)}</span>
            </div>
            <div class="recap-summary-item">
              <span class="recap-item-label">Top Artist</span>
              <span class="recap-item-val">${escapeHtml(topTrack.artists?.[0]?.name || '')}</span>
            </div>
            ${topAlbum ? `<div class="recap-summary-item">
              <span class="recap-item-label">Top Album</span>
              <span class="recap-item-val">${escapeHtml(topAlbum.name)}</span>
            </div>` : ''}
            ${hasGenreData ? `<div class="recap-summary-item">
              <span class="recap-item-label">Top Genre</span>
              <span class="recap-item-val">${escapeHtml(stats.dominantGenre || genres[0]?.name || '')}</span>
            </div>` : ''}
            <div class="recap-summary-item">
              <span class="recap-item-label">Ranked Set Duration</span>
              <span class="recap-item-val" style="color:#10b981;">${rankedTrackMinutes.toLocaleString()} min</span>
            </div>
            ${stats.auraTitle ? `<div class="recap-summary-item">
              <span class="recap-item-label">Sonic Aura</span>
              <span class="recap-item-val" style="color:#c084fc;">${escapeHtml(stats.auraTitle)}</span>
            </div>` : ''}
          </div>
        </div>

        <div class="recap-actions-row">
          <button class="btn-recap-action btn-recap-primary" id="btn-recap-download">
            Download story image
          </button>
          <button class="btn-recap-action btn-recap-secondary" id="btn-recap-copy">
            Copy image
          </button>
          <button class="btn-recap-action btn-recap-secondary" id="btn-recap-replay">
            Replay story
          </button>
        </div>
      </div>
    `;

    // Attach track play listener on Hero #1 Track
    const heroBtn = this.viewport.querySelector('#wrapped-hero-track-btn');
    if (heroBtn) {
      const playHero = (e) => {
        e.stopPropagation();
        soundEngine.playTrack(topTrack);
      };
      heroBtn.setAttribute('role', 'button');
      heroBtn.setAttribute('tabindex', '0');
      heroBtn.setAttribute('aria-label', `Play preview for ${topTrack.name}`);
      heroBtn.addEventListener('click', playHero);
      heroBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playHero(e);
        }
      });
    }

    // Attach track play listeners on ladder tracks
    const ladderItems = this.viewport.querySelectorAll('.track-play-trigger');
    ladderItems.forEach(el => {
      const playTrack = (e) => {
        e.stopPropagation();
        const trId = el.getAttribute('data-track-id');
        const tr = tracks.find(t => t.id === trId);
        if (tr) soundEngine.playTrack(tr);
      };
      const tr = tracks.find(t => t.id === el.getAttribute('data-track-id'));
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', tr ? `Play preview for ${tr.name}` : 'Play track preview');
      el.addEventListener('click', playTrack);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          playTrack(e);
        }
      });
    });

    // Attach action listeners on Slide 5
    const btnDownload = this.viewport.querySelector('#btn-recap-download');
    btnDownload?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        showToast('Exporting listening archive story card...', 'info', 2000);
        const recapEl = document.getElementById('wrapped-recap-export-card');
        const dataUrl = await exportCardAsImage('story', recapEl);
        downloadDataUrl(dataUrl, 'soulseekr-listening-archive.png');
        showToast('Downloaded Wrapped Story!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    const btnCopy = this.viewport.querySelector('#btn-recap-copy');
    btnCopy?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const recapEl = document.getElementById('wrapped-recap-export-card');
        await copyCardToClipboard(recapEl);
        showToast('Copied Wrapped card to clipboard!', 'success');
      } catch (err) {
        showToast('Clipboard copy: Please click Download Story instead', 'error');
      }
    });

    const btnReplay = this.viewport.querySelector('#btn-recap-replay');
    btnReplay?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.goToSlide(0);
    });

    this.updatePlaybackUi({
      isPlaying: soundEngine.isPlaying,
      isPaused: soundEngine.isPaused,
      isLoading: soundEngine.isLoading,
      currentTrackId: soundEngine.currentTrackId
    });
  }

  updatePlaybackUi({ isPlaying, isPaused, isLoading, currentTrackId }) {
    if (!this.viewport) return;

    const hero = this.viewport.querySelector('#wrapped-hero-track-btn');
    if (hero) {
      const isCurrent = hero.getAttribute('data-track-id') === currentTrackId;
      hero.classList.toggle('is-playing', isCurrent && isPlaying);
      hero.classList.toggle('is-paused', isCurrent && isPaused);
      const action = isCurrent
        ? (isLoading ? 'Loading preview' : isPaused ? 'Resume preview' : isPlaying ? 'Pause preview' : 'Play preview')
        : 'Play preview';
      const label = hero.querySelector('.top-track-play-btn');
      if (label) label.textContent = action;
      hero.setAttribute('aria-label', `${action} for ${this.data?.topTracks?.[0]?.name || 'top track'}`);
    }

    this.viewport.querySelectorAll('.ladder-item[data-track-id]').forEach(item => {
      const trackId = item.getAttribute('data-track-id');
      const isCurrent = trackId === currentTrackId;
      item.classList.toggle('is-playing', isCurrent && isPlaying);
      item.classList.toggle('is-paused', isCurrent && isPaused);
      const cue = item.querySelector('.ladder-play-state');
      if (cue) cue.textContent = isCurrent && isLoading ? '…' : isCurrent && isPlaying ? 'Ⅱ' : '▶';
      const action = isCurrent
        ? (isLoading ? 'Cancel' : isPaused ? 'Resume' : isPlaying ? 'Pause' : 'Play')
        : 'Play';
      const track = this.data?.topTracks?.find(candidate => candidate.id === trackId);
      item.setAttribute('aria-label', `${action} preview for ${track?.name || 'track'}`);
    });
  }

  goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= this.totalSlides) {
      // Loop or stop at final recap slide
      index = this.totalSlides - 1;
    }

    this.currentSlideIndex = index;

    // Update Three.js scene palette
    if (this.visualizer) {
      this.visualizer.setSlide(index);
    }

    // Update Ambient Stage Glow
    const theme = SLIDE_THEMES[index] || SLIDE_THEMES[0];
    if (this.glowBg) {
      this.glowBg.style.setProperty('--slide-accent', theme.primary);
    }

    // Update Slide DOM Visibility
    const slides = this.viewport.querySelectorAll('.wrapped-slide');
    slides.forEach((s, idx) => {
      if (idx === index) {
        s.classList.add('is-active');
      } else {
        s.classList.remove('is-active');
      }
    });

    // Update Progress Bars State
    this.updateProgressBarsState();

    // Each story gets a distinct random pick from the user's top-50 pool.
    this.playSlideAudio(index);

    // Start auto-advance progress timer for this slide
    this.startProgress();
  }

  nextSlide() {
    if (this.currentSlideIndex < this.totalSlides - 1) {
      this.goToSlide(this.currentSlideIndex + 1);
    } else {
      // On final slide, keep paused on recap
      this.stopProgress();
    }
  }

  prevSlide() {
    if (this.currentSlideIndex > 0) {
      this.goToSlide(this.currentSlideIndex - 1);
    } else {
      this.goToSlide(0);
    }
  }

  updateProgressBarsState() {
    const segs = this.progressTrack?.querySelectorAll('.wrapped-seg');
    if (!segs) return;

    segs.forEach((seg, i) => {
      const fill = seg.querySelector('.wrapped-seg-fill');
      if (i < this.currentSlideIndex) {
        seg.classList.add('completed');
        seg.removeAttribute('aria-current');
        if (fill) fill.style.width = '100%';
      } else if (i === this.currentSlideIndex) {
        seg.classList.remove('completed');
        seg.setAttribute('aria-current', 'step');
        if (fill) fill.style.width = '0%';
      } else {
        seg.classList.remove('completed');
        seg.removeAttribute('aria-current');
        if (fill) fill.style.width = '0%';
      }
    });
  }

  startProgress() {
    this.stopProgress();
    this.progressStartTime = performance.now();
    this.isPaused = false;

    // On final recap slide, don't auto-advance so user can read / export at leisure
    if (this.currentSlideIndex === this.totalSlides - 1) {
      const segs = this.progressTrack?.querySelectorAll('.wrapped-seg');
      const curFill = segs?.[this.currentSlideIndex]?.querySelector('.wrapped-seg-fill');
      if (curFill) curFill.style.width = '100%';
      return;
    }

    const animateProgress = (timestamp) => {
      if (this.isPaused) return;

      const elapsed = timestamp - this.progressStartTime;
      const progress = Math.min(1, elapsed / this.slideDurationMs);

      const segs = this.progressTrack?.querySelectorAll('.wrapped-seg');
      const curFill = segs?.[this.currentSlideIndex]?.querySelector('.wrapped-seg-fill');
      if (curFill) {
        curFill.style.width = `${(progress * 100).toFixed(1)}%`;
      }

      if (progress < 1) {
        this.progressAnimId = requestAnimationFrame(animateProgress);
      } else {
        this.nextSlide();
      }
    };

    this.progressAnimId = requestAnimationFrame(animateProgress);
  }

  pauseProgress() {
    this.isPaused = true;
    if (this.progressAnimId) {
      cancelAnimationFrame(this.progressAnimId);
      this.progressAnimId = null;
    }
  }

  resumeProgress() {
    if (!this.isPaused || this.currentSlideIndex === this.totalSlides - 1) return;
    this.isPaused = false;

    const segs = this.progressTrack?.querySelectorAll('.wrapped-seg');
    const curFill = segs?.[this.currentSlideIndex]?.querySelector('.wrapped-seg-fill');
    const currentPercent = curFill ? parseFloat(curFill.style.width) || 0 : 0;
    const remainingRatio = 1 - (currentPercent / 100);

    const adjustedDuration = this.slideDurationMs * remainingRatio;
    const resumeStart = performance.now();

    const animateResume = (now) => {
      if (this.isPaused) return;
      const elapsed = now - resumeStart;
      const fraction = Math.min(1, elapsed / adjustedDuration);
      const totalPct = currentPercent + fraction * (100 - currentPercent);

      if (curFill) {
        curFill.style.width = `${totalPct.toFixed(1)}%`;
      }

      if (fraction < 1) {
        this.progressAnimId = requestAnimationFrame(animateResume);
      } else {
        this.nextSlide();
      }
    };

    this.progressAnimId = requestAnimationFrame(animateResume);
  }

  stopProgress() {
    if (this.progressAnimId) {
      cancelAnimationFrame(this.progressAnimId);
      this.progressAnimId = null;
    }
  }
}

// Singleton Instance
export const wrappedExperience = new WrappedExperience();
