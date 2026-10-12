/**
 * Soulseekr — Spotify Wrapped 3D Interactive Story Experience
 * Powered by Three.js WebGL particle field & Apple-grade fluid story transitions
 */

import { soundEngine } from './audio-player.js';
import { exportCardAsImage, downloadDataUrl, copyCardToClipboard } from './exporter.js';
import { showToast } from './app.js';

// Slide Theme Palettes for Three.js & Stage Glow
const SLIDE_THEMES = [
  { primary: '#10b981', secondary: '#8b5cf6', threeColors: [0x10b981, 0x8b5cf6] }, // Slide 0: Emerald & Violet
  { primary: '#ec4899', secondary: '#06b6d4', threeColors: [0xec4899, 0x06b6d4] }, // Slide 1: Pink & Cyan
  { primary: '#f59e0b', secondary: '#6366f1', threeColors: [0xf59e0b, 0x6366f1] }, // Slide 2: Amber & Indigo
  { primary: '#10b981', secondary: '#14b8a6', threeColors: [0x10b981, 0x14b8a6] }, // Slide 3: Electric Emerald & Teal
  { primary: '#8b5cf6', secondary: '#f43f5e', threeColors: [0x8b5cf6, 0xf43f5e] }, // Slide 4: Velvet Violet & Rose
  { primary: '#facc15', secondary: '#3b82f6', threeColors: [0xfacc15, 0x3b82f6] }  // Slide 5: Cosmic Gold & Royal Blue
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
    this.activeColor1 = new (window.THREE ? THREE.Color : Object)(0x10b981);
    this.activeColor2 = new (window.THREE ? THREE.Color : Object)(0x8b5cf6);
    this.targetColor1 = new (window.THREE ? THREE.Color : Object)(0x10b981);
    this.targetColor2 = new (window.THREE ? THREE.Color : Object)(0x8b5cf6);

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

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
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

    this.onKeyDown = this.handleKeyDown.bind(this);
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

    if (e.key === 'ArrowRight' || e.key === 'Space') {
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

  open(data, timeRange = 'short_term') {
    this.data = data;
    this.timeRange = timeRange;

    // Populate Top Bar
    const user = data.user || { display_name: 'Soulseekr Archivist' };
    if (this.userName) this.userName.textContent = user.display_name;
    if (this.userAvatar) {
      this.userAvatar.src = (user.images && user.images[0]?.url) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
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
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', this.onKeyDown);

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

    // Try playing top track audio snippet
    this.playSlideAudio();
  }

  close() {
    this.modal.classList.remove('is-open');
    document.body.style.overflow = '';
    window.removeEventListener('keydown', this.onKeyDown);
    this.stopProgress();

    if (this.visualizer) {
      this.visualizer.stop();
    }

    // Stop sound if playing
    soundEngine.stop();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.btnMute) {
      this.btnMute.innerHTML = this.isMuted ? '🔇' : '🔊';
      this.btnMute.title = this.isMuted ? 'Unmute Audio' : 'Mute Audio';
    }

    if (this.isMuted) {
      soundEngine.stop();
      showToast('Wrapped Audio Muted', 'info', 1500);
    } else {
      this.playSlideAudio();
      showToast('Wrapped Audio Unmuted', 'info', 1500);
    }
  }

  async playSlideAudio() {
    if (this.isMuted || !this.data || !this.data.topTracks || !this.data.topTracks.length) return;
    const topTrack = this.data.topTracks[0];
    if (topTrack) {
      try {
        await soundEngine.playTrack(topTrack);
      } catch (err) {
        console.warn('Could not auto-play top track:', err);
      }
    }
  }

  setupProgressBar() {
    if (!this.progressTrack) return;
    this.progressTrack.innerHTML = '';
    for (let i = 0; i < this.totalSlides; i++) {
      const seg = document.createElement('div');
      seg.className = 'wrapped-seg';
      seg.setAttribute('data-index', i);
      const fill = document.createElement('div');
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

    const topTrack = tracks[0] || { name: 'Starboy', artists: [{ name: 'The Weeknd' }], album: { images: [{ url: '' }] } };
    const topAlbum = albums[0] || { name: 'Starboy', artistName: 'The Weeknd', releaseYear: '2016', images: [{ url: '' }] };
    const userImg = (data.user?.images && data.user.images[0]?.url) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    const totalMinutesFormatted = Number(stats.totalMinutes || 48320).toLocaleString();
    const daysEquivalent = ((stats.totalMinutes || 48320) / 1440).toFixed(1);

    this.viewport.innerHTML = `
      <!-- Slide 0: Prologue / Cosmic Identity -->
      <div class="wrapped-slide" data-slide="0">
        <div>
          <span class="slide-eyebrow">✨ 2026 ARCHIVE • UNSEALED</span>
          <h2 class="slide-title">Your Year in Music</h2>
          <p class="slide-desc">A journey across genres, late nights, and defining frequencies.</p>
        </div>

        <div class="prologue-center">
          <div class="prologue-avatar-orb">
            <img class="prologue-avatar-img" src="${userImg}" alt="Avatar">
          </div>
          <div class="prologue-stat-box">
            <span class="prologue-big-number">${totalMinutesFormatted}</span>
            <span class="prologue-stat-label">Total Minutes Listened</span>
          </div>
          <div class="prologue-vibe-pill">
            <span>🔮</span> ${stats.vibeLabel || 'Cinematic Dreamer'}
          </div>
        </div>

        <div class="prologue-prompt">
          Tap or press Space to explore →
        </div>
      </div>

      <!-- Slide 1: Top 5 Tracks (The Anthems) -->
      <div class="wrapped-slide" data-slide="1">
        <div>
          <span class="slide-eyebrow">👑 TOP 5 SONGS</span>
          <h2 class="slide-title">The Anthems</h2>
          <p class="slide-desc">The track you ran through the ground and couldn't get enough of.</p>
        </div>

        <!-- #1 Hero Track Card -->
        <div class="top-track-hero" id="wrapped-hero-track-btn" data-track-id="${topTrack.id || ''}">
          <div class="top-track-vinyl-wrapper">
            <img class="top-track-art" src="${topTrack.album?.images?.[0]?.url || ''}" alt="Cover">
            <div class="top-track-vinyl"></div>
          </div>
          <div class="top-track-info">
            <span class="top-track-badge">#1 MOST PLAYED</span>
            <span class="top-track-name">${topTrack.name}</span>
            <span class="top-track-artist">${topTrack.artists?.map(a => a.name).join(', ')}</span>
            <span class="top-track-play-btn">▶ Play Studio Snippet</span>
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
                <span class="ladder-artist">${track.artists?.map(a => a.name).join(', ')}</span>
              </div>
              <span style="font-size:0.75rem; color:#10b981; opacity:0.7;">▶</span>
            </div>
          `).join('')}
        </div>

        <div style="font-size:0.675rem; color:rgba(255,255,255,0.4); text-align:center;">
          Tap any track to preview audio
        </div>
      </div>

      <!-- Slide 2: Top 5 Albums (Heavy Rotations) -->
      <div class="wrapped-slide" data-slide="2">
        <div>
          <span class="slide-eyebrow">💿 HEAVY ROTATIONS</span>
          <h2 class="slide-title">Top 5 Albums</h2>
          <p class="slide-desc">The complete bodies of work that defined your headspace.</p>
        </div>

        <!-- #1 Hero Album Card -->
        <div class="album-hero">
          <img class="album-hero-bg" src="${topAlbum.images?.[0]?.url || ''}" alt="Album">
          <div class="album-hero-scrim"></div>
          <div class="album-hero-content">
            <span class="album-crown-tag">#1 ALBUM • ${topAlbum.releaseYear || '2024'}</span>
            <span class="album-hero-name">${topAlbum.name}</span>
            <span class="album-hero-artist">${topAlbum.artistName || topAlbum.artists?.[0]?.name || ''}</span>
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

        <div style="font-size:0.675rem; color:rgba(255,255,255,0.4); text-align:center;">
          Curated from your continuous listening rotations
        </div>
      </div>

      <!-- Slide 3: Minutes & Sonic DNA -->
      <div class="wrapped-slide" data-slide="3">
        <div>
          <span class="slide-eyebrow">⚡ TIME & FREQUENCY</span>
          <h2 class="slide-title">Sonic DNA</h2>
          <p class="slide-desc">The raw acoustic physics behind your listening habits.</p>
        </div>

        <div class="minutes-hero-block">
          <span class="minutes-counter">${totalMinutesFormatted}</span>
          <span class="minutes-subtext">Minutes with headphones on (${daysEquivalent} full days of music)</span>
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
            <span class="metric-bento-label">Average Tempo</span>
            <span class="metric-bento-val">${stats.tempoBpm || 122} BPM</span>
            <div class="metric-bento-bar"><div class="metric-bento-fill" style="width: ${(stats.tempoBpm || 122) / 1.7}%"></div></div>
          </div>
          <div class="metric-bento-card">
            <span class="metric-bento-label">Energy Factor</span>
            <span class="metric-bento-val">${stats.energyScore || 78}%</span>
            <div class="metric-bento-bar"><div class="metric-bento-fill" style="width: ${stats.energyScore || 78}%"></div></div>
          </div>
          <div class="metric-bento-card">
            <span class="metric-bento-label">Danceability</span>
            <span class="metric-bento-val">${stats.danceScore || 72}%</span>
            <div class="metric-bento-bar"><div class="metric-bento-fill" style="width: ${stats.danceScore || 72}%"></div></div>
          </div>
          <div class="metric-bento-card">
            <span class="metric-bento-label">Obscurity Snob</span>
            <span class="metric-bento-val">${stats.obscurityScore || 78}%</span>
            <div class="metric-bento-bar"><div class="metric-bento-fill" style="width: ${stats.obscurityScore || 78}%"></div></div>
          </div>
        </div>
      </div>

      <!-- Slide 4: Top 5 Genres & Sonic Aura -->
      <div class="wrapped-slide" data-slide="4">
        <div>
          <span class="slide-eyebrow">🔮 MUSIC ECOSYSTEM</span>
          <h2 class="slide-title">Top 5 Genres</h2>
          <p class="slide-desc">How your sonic universe breaks down across genres.</p>
        </div>

        <div class="genres-stack">
          ${genres.slice(0, 5).map(genre => `
            <div class="genre-bar-item">
              <div class="genre-bar-header">
                <span>${genre.name}</span>
                <span class="genre-bar-pct">${genre.percentage}%</span>
              </div>
              <div class="genre-bar-track">
                <div class="genre-bar-fill" style="width: ${genre.percentage}%"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="aura-card-box">
          <div class="aura-orb-sphere"></div>
          <div class="aura-card-text">
            <span class="aura-card-title">${stats.auraTitle || 'Subterranean Velvet'}</span>
            <span class="aura-card-desc">${stats.obscurityTier || 'Underground Crate Digger'} • ${stats.dominantGenre || 'Neo-Psychedelia'}</span>
          </div>
        </div>
      </div>

      <!-- Slide 5: Master Recap Archive Card -->
      <div class="wrapped-slide" data-slide="5">
        <div>
          <span class="slide-eyebrow">🏆 GRAND FINALE</span>
          <h2 class="slide-title">Your 2026 Archive</h2>
          <p class="slide-desc">Your sonic identity condensed into a permanent physical card.</p>
        </div>

        <!-- Master Recap Artifact Container (Exportable) -->
        <div class="recap-card-artifact" id="wrapped-recap-export-card">
          <div class="recap-artifact-header">
            <span class="recap-brand">SOULSEEKR // ARCHIVE</span>
            <span class="recap-year-pill">2026 WRAPPED</span>
          </div>

          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2px solid #10b981;" src="${userImg}" alt="avatar">
            <div>
              <div style="font-size:0.95rem; font-weight:800; color:#fff;">${data.user?.display_name || 'Soulseekr Archivist'}</div>
              <div style="font-size:0.7rem; color:rgba(255,255,255,0.6);">${stats.vibeLabel || 'Cinematic Dreamer'}</div>
            </div>
          </div>

          <div class="recap-summary-grid">
            <div class="recap-summary-item">
              <span class="recap-item-label">Top Track</span>
              <span class="recap-item-val">${topTrack.name}</span>
            </div>
            <div class="recap-summary-item">
              <span class="recap-item-label">Top Artist</span>
              <span class="recap-item-val">${topTrack.artists?.[0]?.name || 'Artist'}</span>
            </div>
            <div class="recap-summary-item">
              <span class="recap-item-label">Top Album</span>
              <span class="recap-item-val">${topAlbum.name}</span>
            </div>
            <div class="recap-summary-item">
              <span class="recap-item-label">Top Genre</span>
              <span class="recap-item-val">${stats.dominantGenre || 'Neo-Psychedelia'}</span>
            </div>
            <div class="recap-summary-item">
              <span class="recap-item-label">Minutes Listened</span>
              <span class="recap-item-val" style="color:#10b981;">${totalMinutesFormatted}</span>
            </div>
            <div class="recap-summary-item">
              <span class="recap-item-label">Sonic Aura</span>
              <span class="recap-item-val" style="color:#c084fc;">${stats.auraTitle || 'Velvet'}</span>
            </div>
          </div>
        </div>

        <div class="recap-actions-row">
          <button class="btn-recap-action btn-recap-primary" id="btn-recap-download">
            <span>💾</span> Download Story
          </button>
          <button class="btn-recap-action btn-recap-secondary" id="btn-recap-copy">
            <span>📋</span> Copy
          </button>
          <button class="btn-recap-action btn-recap-secondary" id="btn-recap-replay">
            <span>🔄</span> Replay
          </button>
        </div>
      </div>
    `;

    // Attach track play listener on Hero #1 Track
    const heroBtn = this.viewport.querySelector('#wrapped-hero-track-btn');
    if (heroBtn) {
      heroBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundEngine.playTrack(topTrack);
        heroBtn.classList.toggle('is-playing');
      });
    }

    // Attach track play listeners on ladder tracks
    const ladderItems = this.viewport.querySelectorAll('.track-play-trigger');
    ladderItems.forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const trId = el.getAttribute('data-track-id');
        const tr = tracks.find(t => t.id === trId);
        if (tr) soundEngine.playTrack(tr);
      });
    });

    // Attach action listeners on Slide 5
    const btnDownload = this.viewport.querySelector('#btn-recap-download');
    btnDownload?.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        showToast('Exporting 2026 Wrapped Story card...', 'info', 2000);
        const recapEl = document.getElementById('wrapped-recap-export-card');
        const dataUrl = await exportCardAsImage('story', recapEl);
        downloadDataUrl(dataUrl, 'soulseekr-wrapped-2026.png');
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
        if (fill) fill.style.width = '100%';
      } else if (i === this.currentSlideIndex) {
        seg.classList.remove('completed');
        if (fill) fill.style.width = '0%';
      } else {
        seg.classList.remove('completed');
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
