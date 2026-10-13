/**
 * Soulseekr — "Amaze Me" Multiverse Experience Engine
 * Real-time Three.js 3D Cosmic Renderer with Orbital Physics, Bioluminescent Ocean Waves,
 * Cyberpunk Skyline, Accretion Singularity & Studio Audio Integration.
 */

import { soundEngine } from './audio-player.js';
import { showToast } from './app.js';
import { exportCardAsImage, downloadDataUrl } from './exporter.js';
import { escapeHtml, formatDuration } from './card-renderer.js';

// Scene Configuration & Metadata
const SCENES = [
  {
    id: 0,
    title: 'Scene 01 / Solar System',
    sub: 'Top 5 Tracks in Orbital Resonance',
    cameraZ: 0,
    cameraY: 18,
    cameraX: 0,
    lookAt: { x: 0, y: 0, z: 0 },
    fogDensity: 0.002,
    telemCoords: 'RA 18h 36m / DEC +38° 47′',
    telemVelocity: '0.12c'
  },
  {
    id: 1,
    title: 'Scene 02 / The Midnight Voyage',
    sub: 'Top Artists across the Phosphor Sea',
    cameraZ: -140,
    cameraY: 8,
    cameraX: 0,
    lookAt: { x: 0, y: 3, z: -175 },
    fogDensity: 0.006,
    telemCoords: 'LAT 54° 12′ N / LON 130° 40′ W',
    telemVelocity: '0.45c'
  },
  {
    id: 2,
    title: 'Scene 03 / Neon Metropolis',
    sub: 'Top Genres as Kinetic Architecture',
    cameraZ: -290,
    cameraY: 26,
    cameraX: 0,
    lookAt: { x: 0, y: 15, z: -330 },
    fogDensity: 0.004,
    telemCoords: 'GRID SECTOR 09 / CYBER-DENSITY 88%',
    telemVelocity: '0.78c'
  },
  {
    id: 3,
    title: 'Scene 04 / Sonic Singularity',
    sub: 'Aura & Obscurity Gravitational Core',
    cameraZ: -440,
    cameraY: 12,
    cameraX: 0,
    lookAt: { x: 0, y: 0, z: -480 },
    fogDensity: 0.003,
    telemCoords: 'EVENT HORIZON / KERR SINGULARITY',
    telemVelocity: '0.99c'
  },
  {
    id: 4,
    title: 'Scene 05 / Cosmic Archive',
    sub: 'Holographic Artifact & Identity Summary',
    cameraZ: -560,
    cameraY: 0,
    cameraX: 0,
    lookAt: { x: 0, y: 0, z: -590 },
    fogDensity: 0.001,
    telemCoords: 'DEEP MEMORY / ARCHIVE TERMINUS',
    telemVelocity: 'WARP FACTOR 9'
  }
];

class AmazeMeEngine {
  constructor() {
    this.modal = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = null;
    this.animId = null;
    this.isOpen = false;
    this.isMuted = false;
    this.isFullscreen = false;

    // Data references
    this.data = null;
    this.timeRange = 'short_term';

    // Navigation & camera progression
    this.scrollProgress = 0; // 0.0 to 4.0
    this.targetScroll = 0;
    this.currentSceneIdx = 0;
    this.mouse = { x: 0, y: 0, screenX: 0, screenY: 0 };
    this.raycaster = null;

    // NASA Eyes Orbit Camera & Inspection State
    this.billboardsLayerEl = null;
    this.selectorBarEl = null;
    this.inspectorDrawerEl = null;
    this.orbitTheta = Math.PI * 0.15;
    this.orbitPhi = 0.58;
    this.orbitRadius = 38;
    this.targetOrbitTheta = this.orbitTheta;
    this.targetOrbitPhi = this.orbitPhi;
    this.targetOrbitRadius = this.orbitRadius;
    this.targetLookAt = null;
    this.currentLookAt = null;
    this.isDragging = false;
    this.hasDragged = false;
    this.dragStart = { x: 0, y: 0 };
    this.isInspecting = false;
    this.inspectedPlanetIdx = -1;

    // 3D Scene object groups
    this.starfield = null;
    this.solarSystemGroup = null;
    this.planets = []; // { mesh, track, orbitRadius, angle, speed, ring }
    this.oceanGroup = null;
    this.oceanPlane = null;
    this.boatMesh = null;
    this.boatParticles = null;
    this.artistMonoliths = [];
    this.cityGroup = null;
    this.skyscrapers = [];
    this.rainParticles = null;
    this.singularityGroup = null;
    this.accretionDisk = null;
    this.singularityCore = null;
    this.warpTunnel = null;
    this.finaleGroup = null;
    this.finaleArtifact = null;

    // Interactive hover targets
    this.hoverableObjects = [];
    this.hoveredObject = null;

    // Audio synthesizer for ambient cosmic soundscape
    this.audioCtx = null;
    this.ambientGain = null;
    this.ambientOscs = [];

    // Bound handlers
    this.onWheel = this.handleWheel.bind(this);
    this.onTouchStart = this.handleTouchStart.bind(this);
    this.onTouchMove = this.handleTouchMove.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onClick = this.handleClick.bind(this);
    this.onKeyDown = this.handleKeyDown.bind(this);
    this.onResize = this.handleResize.bind(this);

    this.touchStartY = 0;
  }

  /**
   * Launch the Amaze Me experience
   */
  open(data, timeRange = 'short_term') {
    this.data = data;
    this.timeRange = timeRange;

    this.ensureDomElements();
    this.modal.classList.add('is-open');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';

    if (!this.renderer) {
      this.initThree();
    } else {
      this.handleResize();
    }

    // Rebuild/refresh 3D assets with active user data
    this.buildUniverse();

    // Start render loop & ambient synth
    this.clock = new THREE.Clock();
    this.startLoop();
    this.startAmbientAudio();

    // Reset camera scroll to 0
    this.targetScroll = 0;
    this.scrollProgress = 0;
    this.resetToSolarSystem();
    this.updateHUD(0);

    // Attach interaction listeners
    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('click', this.onClick);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);

    showToast('Click & drag to orbit • Hover & click celestial bodies to inspect', 'info', 4000);
  }

  /**
   * Close the Amaze Me modal
   */
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.modal.classList.remove('is-open');
    document.body.style.overflow = '';

    this.stopLoop();
    this.stopAmbientAudio();
    soundEngine.stop();

    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('click', this.onClick);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);

    this.hideInspectorDrawer();
    this.hideBillboardTags();

    if (this.tooltipEl) {
      this.tooltipEl.classList.remove('is-visible');
    }
    if (this.reticleEl) {
      this.reticleEl.classList.remove('active');
    }
  }

  /**
   * Query or build DOM modal structure
   */
  ensureDomElements() {
    this.modal = document.getElementById('amaze-modal');
    this.canvas = document.getElementById('amaze-canvas');
    this.sceneNameEl = document.getElementById('amaze-hud-scene-name');
    this.sceneSubEl = document.getElementById('amaze-hud-sub');
    this.telemCoordsEl = document.getElementById('amaze-telem-coords');
    this.telemVelEl = document.getElementById('amaze-telem-vel');
    this.sceneNavEl = document.getElementById('amaze-scene-nav');
    this.tooltipEl = document.getElementById('amaze-planet-tooltip');
    this.speedLinesEl = document.getElementById('amaze-speed-lines');
    this.btnAudio = document.getElementById('btn-amaze-audio');
    this.btnFullscreen = document.getElementById('btn-amaze-fullscreen');
    this.btnClose = document.getElementById('btn-amaze-close');

    // NASA Eyes Layers
    this.billboardsLayerEl = document.getElementById('amaze-billboards-layer');
    this.selectorBarEl = document.getElementById('amaze-planet-selector-bar');
    this.inspectorDrawerEl = document.getElementById('amaze-inspector-drawer');

    // Create target reticle element if not present
    if (!document.getElementById('amaze-target-reticle')) {
      const reticle = document.createElement('div');
      reticle.id = 'amaze-target-reticle';
      reticle.className = 'amaze-target-reticle';
      this.modal.appendChild(reticle);
    }
    this.reticleEl = document.getElementById('amaze-target-reticle');

    // Create finale container if not present
    if (!document.getElementById('amaze-finale-container')) {
      const fin = document.createElement('div');
      fin.id = 'amaze-finale-container';
      fin.className = 'amaze-finale-container';
      this.modal.appendChild(fin);
    }
    this.finaleContainerEl = document.getElementById('amaze-finale-container');

    // Build Scene Nav Rail
    if (this.sceneNavEl) {
      this.sceneNavEl.innerHTML = '';
      SCENES.forEach((sc, i) => {
        const item = document.createElement('button');
        item.className = `amaze-nav-item ${i === 0 ? 'active' : ''}`;
        item.setAttribute('aria-label', sc.title);
        item.innerHTML = `
          <span class="amaze-nav-label">${sc.title.split('/')[1] || sc.title}</span>
          <span class="amaze-nav-marker"></span>
        `;
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this.targetScroll = i;
        });
        this.sceneNavEl.appendChild(item);
      });
    }

    // Bind HUD buttons
    if (this.btnClose) {
      this.btnClose.onclick = () => this.close();
    }
    if (this.btnFullscreen) {
      this.btnFullscreen.onclick = () => this.toggleFullscreen();
    }
    if (this.btnAudio) {
      this.btnAudio.onclick = () => this.toggleAudio();
    }
  }

  /**
   * WebGL Three.js Initialization
   */
  initThree() {
    if (typeof window.THREE === 'undefined') {
      console.error('Three.js is not loaded globally');
      return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030305, 0.002);

    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1500);
    this.camera.position.set(0, 18, 28);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.raycaster = new THREE.Raycaster();

    // Ambient and Directional Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 40, 30);
    this.scene.add(dirLight);

    // Primary infinite starfield spanning all scenes
    this.createCosmicStarfield();
  }

  /**
   * Create deep multi-layered cosmic starfield
   */
  createCosmicStarfield() {
    if (this.starfield) this.scene.remove(this.starfield);

    const starCount = 3500;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const colorPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0xc084fc), // Violet
      new THREE.Color(0xfacc15), // Gold
      new THREE.Color(0x10b981)  // Emerald
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      // Cylinder distribution along Z travel axis (0 to -650)
      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * 140;
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius + (Math.random() - 0.5) * 80;
      positions[i3 + 2] = 50 - Math.random() * 700;

      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      sizes[i] = 1.0 + Math.random() * 2.5;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.starfield = new THREE.Points(geom, mat);
    this.scene.add(this.starfield);
  }

  /**
   * Build or rebuild all 5 interactive worlds with user data
   */
  buildUniverse() {
    this.hoverableObjects = [];

    this.buildScene0_SolarSystem();
    this.buildScene1_MidnightVoyage();
    this.buildScene2_CyberpunkMetropolis();
    this.buildScene3_Singularity();
    this.buildScene4_FinaleArchive();
  }

  // =========================================================================
  // SCENE 0: SOLAR SYSTEM (TOP 5 TRACKS - NASA EYES ARCHITECTURE)
  // =========================================================================
  buildScene0_SolarSystem() {
    if (this.solarSystemGroup) this.scene.remove(this.solarSystemGroup);
    this.solarSystemGroup = new THREE.Group();
    this.solarSystemGroup.position.set(0, 0, 0);
    this.scene.add(this.solarSystemGroup);

    this.planets = [];

    // Central Star (The Pulsing Nucleus)
    const sunGeom = new THREE.SphereGeometry(4.2, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffaa22,
      wireframe: false
    });
    const sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.solarSystemGroup.add(sunMesh);

    // Sun glowing corona
    const coronaGeom = new THREE.SphereGeometry(5.2, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const coronaMesh = new THREE.Mesh(coronaGeom, coronaMat);
    this.solarSystemGroup.add(coronaMesh);

    // Sun PointLight
    const sunLight = new THREE.PointLight(0xffeedd, 2.8, 120);
    this.solarSystemGroup.add(sunLight);

    // Top 5 Tracks as Celestial Spheres - FIXED ASTRONOMICAL COORDINATES
    const tracks = (this.data && this.data.topTracks) ? this.data.topTracks.slice(0, 5) : [];
    const planetColors = [0xf59e0b, 0x06b6d4, 0xec4899, 0x10b981, 0x8b5cf6];
    const orbitRadii = [14, 21, 28, 35, 42];
    const planetSizes = [1.8, 1.4, 1.5, 1.2, 1.3];
    const fixedAngles = [0.45, 1.85, 3.25, 4.55, 5.85];

    tracks.forEach((track, i) => {
      const radius = orbitRadii[i] || (14 + i * 7);
      const size = planetSizes[i] || 1.3;
      const color = planetColors[i] || 0x38bdf8;
      const angle = fixedAngles[i] || ((i * Math.PI * 2) / 5 + 0.4);

      // Orbit Path Ring
      const orbitCurve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
      const points = orbitCurve.getPoints(100);
      const orbitGeom = new THREE.BufferGeometry().setFromPoints(points);
      const orbitMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending
      });
      const orbitLine = new THREE.Line(orbitGeom, orbitMat);
      orbitLine.rotation.x = Math.PI / 2;
      this.solarSystemGroup.add(orbitLine);

      // Planet Sphere - Positioned ONCE at its fixed celestial coordinate
      const pGeom = new THREE.SphereGeometry(size, 32, 32);
      const pMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.35,
        metalness: 0.25,
        emissive: color,
        emissiveIntensity: 0.22
      });
      const pMesh = new THREE.Mesh(pGeom, pMat);
      pMesh.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      pMesh.userData = {
        type: 'planet',
        index: i,
        rank: i + 1,
        track: track,
        baseSize: size,
        color: color
      };

      // Add Saturn-like rings for #1 Top Track
      let ringMesh = null;
      if (i === 0) {
        const ringGeom = new THREE.RingGeometry(size * 1.5, size * 2.5, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfde047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending
        });
        ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.rotation.x = Math.PI / 2.3;
        pMesh.add(ringMesh);
      }

      this.solarSystemGroup.add(pMesh);
      this.hoverableObjects.push(pMesh);

      this.planets.push({
        mesh: pMesh,
        track: track,
        orbitRadius: radius,
        angle: angle,
        basePosition: pMesh.position.clone(),
        ring: ringMesh
      });
    });

    // Cosmic Asteroid Belt between Orbit 2 & 3
    const asteroidCount = 450;
    const astGeom = new THREE.BufferGeometry();
    const astPos = new Float32Array(asteroidCount * 3);
    for (let j = 0; j < asteroidCount; j++) {
      const aTheta = Math.random() * Math.PI * 2;
      const aR = 24.5 + (Math.random() - 0.5) * 3.5;
      astPos[j * 3] = Math.cos(aTheta) * aR;
      astPos[j * 3 + 1] = (Math.random() - 0.5) * 1.8;
      astPos[j * 3 + 2] = Math.sin(aTheta) * aR;
    }
    astGeom.setAttribute('position', new THREE.BufferAttribute(astPos, 3));
    const astMat = new THREE.PointsMaterial({
      color: 0xa1a1aa,
      size: 0.5,
      transparent: true,
      opacity: 0.6
    });
    const asteroidBelt = new THREE.Points(astGeom, astMat);
    this.solarSystemGroup.add(asteroidBelt);

    // Build NASA Eyes Billboard Tags & Bottom Selector Bar
    this.buildBillboardTags(tracks);
    this.buildSelectorBar(tracks, planetColors);
  }

  buildBillboardTags(tracks) {
    if (!this.billboardsLayerEl) return;
    this.billboardsLayerEl.innerHTML = '';

    tracks.forEach((track, i) => {
      const tag = document.createElement('div');
      tag.className = 'planet-billboard';
      tag.id = `planet-billboard-${i}`;
      tag.dataset.idx = i;
      tag.innerHTML = `
        <span class="billboard-rank">0${i + 1}</span>
        <span class="billboard-name">${escapeHtml(track.name)}</span>
      `;
      tag.onclick = (e) => {
        e.stopPropagation();
        this.focusPlanet(i);
      };
      tag.onmouseenter = () => {
        if (this.planets[i]) this.hoverObject(this.planets[i].mesh);
      };
      tag.onmouseleave = () => {
        if (this.planets[i]) this.unhoverObject(this.planets[i].mesh);
      };
      this.billboardsLayerEl.appendChild(tag);
    });
  }

  buildSelectorBar(tracks, planetColors) {
    if (!this.selectorBarEl) return;
    this.selectorBarEl.innerHTML = '';

    const sunBtn = document.createElement('button');
    sunBtn.className = 'selector-pill active';
    sunBtn.dataset.idx = '-1';
    sunBtn.innerHTML = `
      <span class="selector-pill-dot" style="background:#ffaa22;"></span>
      <span>☀️ SUN</span>
    `;
    sunBtn.onclick = (e) => {
      e.stopPropagation();
      this.resetToSolarSystem();
    };
    this.selectorBarEl.appendChild(sunBtn);

    tracks.forEach((track, i) => {
      const btn = document.createElement('button');
      btn.className = 'selector-pill';
      btn.dataset.idx = i;
      const colHex = '#' + (planetColors[i] || 0x38bdf8).toString(16).padStart(6, '0');
      btn.innerHTML = `
        <span class="selector-pill-dot" style="background:${colHex};"></span>
        <span>0${i + 1} ${escapeHtml(track.name.slice(0, 14))}</span>
      `;
      btn.onclick = (e) => {
        e.stopPropagation();
        this.focusPlanet(i);
      };
      this.selectorBarEl.appendChild(btn);
    });
  }

  focusPlanet(idx) {
    const p = this.planets[idx];
    if (!p) return;
    this.isInspecting = true;
    this.inspectedPlanetIdx = idx;

    if (!this.targetLookAt) this.targetLookAt = new THREE.Vector3();
    this.targetLookAt.copy(p.mesh.position);
    this.targetOrbitRadius = 8.6;
    this.targetOrbitPhi = 0.45;
    this.targetOrbitTheta = p.angle + 0.35;

    this.showInspectorDrawer(p);
    this.updateSelectorPills(idx);
    this.updateBillboardActive(idx);

    soundEngine.playTrack(p.track);
    showToast(`Inspecting Orbit 0${idx + 1}: ${p.track.name}`, 'info', 2200);
  }

  resetToSolarSystem() {
    this.isInspecting = false;
    this.inspectedPlanetIdx = -1;
    if (this.targetLookAt) this.targetLookAt.set(0, 0, 0);
    this.targetOrbitRadius = 38;
    this.targetOrbitPhi = 0.58;
    this.targetOrbitTheta = Math.PI * 0.15;

    this.hideInspectorDrawer();
    this.updateSelectorPills(-1);
    this.updateBillboardActive(-1);
  }

  showInspectorDrawer(p) {
    if (!this.inspectorDrawerEl) return;
    const track = p.track;
    const img = track.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80';
    const artists = track.artists?.map(a => a.name).join(', ') || 'Unknown Artist';
    const durationMin = formatDuration(track.duration_ms);
    const stats = this.data?.stats || {};

    this.inspectorDrawerEl.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-badge">ORBIT #${p.rank} // CELESTIAL RESONANCE</div>
        <button id="btn-close-inspector" class="inspector-close-btn" title="Return to Solar System Overview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="inspector-hero">
        <img src="${img}" class="inspector-art" alt="Album Art">
        <div class="inspector-track-meta">
          <h3 class="inspector-title" title="${escapeHtml(track.name)}">${escapeHtml(track.name)}</h3>
          <p class="inspector-artist" title="${escapeHtml(artists)}">${escapeHtml(artists)}</p>
          <span class="inspector-album" title="${escapeHtml(track.album?.name || '')}">${escapeHtml(track.album?.name || 'Master Single')}</span>
        </div>
      </div>

      <div class="inspector-telemetry-grid">
        <div class="telemetry-cell">
          <span class="telemetry-label">ORBIT RADIUS</span>
          <span class="telemetry-value">${p.orbitRadius} AU</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-label">RUNTIME</span>
          <span class="telemetry-value">${durationMin}</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-label">ENERGY LEVEL</span>
          <span class="telemetry-value">${stats.energyScore || 78}%</span>
        </div>
        <div class="telemetry-cell">
          <span class="telemetry-label">PULSE TEMPO</span>
          <span class="telemetry-value">${stats.tempoBpm || 122} BPM</span>
        </div>
      </div>

      <div class="inspector-actions">
        <button id="btn-inspector-play" class="inspector-play-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Stream Studio Audio</span>
        </button>
        <button id="btn-inspector-back" class="inspector-back-btn">
          <span>← Solar System Overview</span>
        </button>
      </div>
    `;

    this.inspectorDrawerEl.classList.add('is-open');

    const btnClose = this.inspectorDrawerEl.querySelector('#btn-close-inspector');
    if (btnClose) btnClose.onclick = () => this.resetToSolarSystem();

    const btnBack = this.inspectorDrawerEl.querySelector('#btn-inspector-back');
    if (btnBack) btnBack.onclick = () => this.resetToSolarSystem();

    const btnPlay = this.inspectorDrawerEl.querySelector('#btn-inspector-play');
    if (btnPlay) {
      btnPlay.onclick = () => {
        soundEngine.playTrack(track);
        showToast(`Playing Studio Preview: ${track.name}`, 'info', 2200);
      };
    }
  }

  hideInspectorDrawer() {
    if (this.inspectorDrawerEl) {
      this.inspectorDrawerEl.classList.remove('is-open');
    }
  }

  updateSelectorPills(activeIdx) {
    if (!this.selectorBarEl) return;
    const pills = this.selectorBarEl.querySelectorAll('.selector-pill');
    pills.forEach(p => {
      const idx = parseInt(p.dataset.idx, 10);
      p.classList.toggle('active', idx === activeIdx);
    });
  }

  updateBillboardActive(activeIdx) {
    if (!this.billboardsLayerEl) return;
    const tags = this.billboardsLayerEl.querySelectorAll('.planet-billboard');
    tags.forEach(t => {
      const idx = parseInt(t.dataset.idx, 10);
      t.classList.toggle('is-active', idx === activeIdx);
    });
  }

  updateBillboardProjections() {
    if (!this.billboardsLayerEl || !this.camera) return;
    this.planets.forEach((p, i) => {
      const el = document.getElementById(`planet-billboard-${i}`);
      if (!el) return;
      if (this.isInspecting && this.inspectedPlanetIdx === i) {
        el.style.display = 'none';
        return;
      }
      const pos = p.mesh.position.clone();
      pos.y += p.userData.baseSize * 1.6;
      pos.project(this.camera);

      if (pos.z < 1) {
        const sx = (pos.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-(pos.y * 0.5) + 0.5) * window.innerHeight;
        el.style.left = `${sx}px`;
        el.style.top = `${sy}px`;
        el.style.display = 'flex';
      } else {
        el.style.display = 'none';
      }
    });
  }

  hideBillboardTags() {
    if (!this.billboardsLayerEl) return;
    const tags = this.billboardsLayerEl.querySelectorAll('.planet-billboard');
    tags.forEach(t => t.style.display = 'none');
  }

  // =========================================================================
  // SCENE 1: THE MIDNIGHT VOYAGE (TOP 5 ARTISTS & BIOLUMINESCENT SEA)
  // =========================================================================
  buildScene1_MidnightVoyage() {
    if (this.oceanGroup) this.scene.remove(this.oceanGroup);
    this.oceanGroup = new THREE.Group();
    this.oceanGroup.position.set(0, 0, -140);
    this.scene.add(this.oceanGroup);

    this.artistMonoliths = [];

    // Undulating 3D Ocean Surface Plane
    const oceanW = 120;
    const oceanD = 120;
    const segments = 56;
    const oceanGeom = new THREE.PlaneGeometry(oceanW, oceanD, segments, segments);
    oceanGeom.rotateX(-Math.PI / 2);

    // Save initial vertex positions for wave displacement
    const posAttr = oceanGeom.attributes.position;
    oceanGeom.userData = {
      initialY: new Float32Array(posAttr.count),
      count: posAttr.count
    };
    for (let i = 0; i < posAttr.count; i++) {
      oceanGeom.userData.initialY[i] = posAttr.getY(i);
    }

    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x050e1a,
      emissive: 0x082f49,
      emissiveIntensity: 0.45,
      roughness: 0.15,
      metalness: 0.7,
      wireframe: true
    });
    this.oceanPlane = new THREE.Mesh(oceanGeom, oceanMat);
    this.oceanPlane.position.set(0, 0, -35);
    this.oceanGroup.add(this.oceanPlane);

    // Stylized Celestial Obsidian Boat
    const boatGeom = new THREE.ConeGeometry(2.5, 9, 5);
    boatGeom.rotateX(Math.PI / 2);
    boatGeom.scale(0.8, 0.4, 1.2);
    const boatMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8
    });
    this.boatMesh = new THREE.Mesh(boatGeom, boatMat);
    this.boatMesh.position.set(0, 0.8, -20);
    this.oceanGroup.add(this.boatMesh);

    // Boat Mast & Glowing Lantern
    const mastGeom = new THREE.CylinderGeometry(0.08, 0.08, 4.5);
    const mastMesh = new THREE.Mesh(mastGeom, boatMat);
    mastMesh.position.set(0, 2.2, 0);
    this.boatMesh.add(mastMesh);

    const lanternGeom = new THREE.SphereGeometry(0.45, 16, 16);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const lanternMesh = new THREE.Mesh(lanternGeom, lanternMat);
    lanternMesh.position.set(0, 4.2, 0);
    this.boatMesh.add(lanternMesh);

    const lanternLight = new THREE.PointLight(0x38bdf8, 2.2, 25);
    lanternLight.position.set(0, 4.2, 0);
    this.boatMesh.add(lanternLight);

    // Phosphorescent Stern Wake Particles
    const wakeCount = 180;
    const wakeGeom = new THREE.BufferGeometry();
    const wakePos = new Float32Array(wakeCount * 3);
    for (let k = 0; k < wakeCount; k++) {
      wakePos[k * 3] = (Math.random() - 0.5) * 3;
      wakePos[k * 3 + 1] = 0.2;
      wakePos[k * 3 + 2] = 2 + Math.random() * 18;
    }
    wakeGeom.setAttribute('position', new THREE.BufferAttribute(wakePos, 3));
    const wakeMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.8,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.boatParticles = new THREE.Points(wakeGeom, wakeMat);
    this.boatMesh.add(this.boatParticles);

    // Top 5 Artists as Glowing Lighthouse Monoliths / Beacons along the Voyage
    const artists = (this.data && this.data.topArtists) ? this.data.topArtists.slice(0, 5) : [];
    const beaconColors = [0x38bdf8, 0xc084fc, 0x34d399, 0xf472b6, 0xfbbf24];

    artists.forEach((artist, idx) => {
      // Staggered along the waterway
      const side = idx % 2 === 0 ? -1 : 1;
      const xPos = side * (12 + idx * 3.5);
      const zPos = -10 - (idx * 16);

      const mGroup = new THREE.Group();
      mGroup.position.set(xPos, 3, zPos);

      // Glowing Obelisk Column
      const colGeom = new THREE.BoxGeometry(2.2, 10, 2.2);
      const colMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        emissive: beaconColors[idx],
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.8
      });
      const colMesh = new THREE.Mesh(colGeom, colMat);
      colMesh.userData = {
        type: 'artist',
        index: idx,
        rank: idx + 1,
        artist: artist,
        color: beaconColors[idx]
      };
      mGroup.add(colMesh);

      // Rotating Halo Ring
      const haloGeom = new THREE.TorusGeometry(2.4, 0.12, 16, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: beaconColors[idx],
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const haloMesh = new THREE.Mesh(haloGeom, haloMat);
      haloMesh.position.y = 5.2;
      haloMesh.rotation.x = Math.PI / 2;
      mGroup.add(haloMesh);

      // Light Beam to the sky
      const beamLight = new THREE.PointLight(beaconColors[idx], 1.6, 30);
      beamLight.position.y = 5.5;
      mGroup.add(beamLight);

      this.oceanGroup.add(mGroup);
      this.hoverableObjects.push(colMesh);

      this.artistMonoliths.push({
        group: mGroup,
        mesh: colMesh,
        halo: haloMesh,
        artist: artist,
        baseY: 3
      });
    });
  }

  // =========================================================================
  // SCENE 2: THE CYBERPUNK METROPOLIS (TOP GENRES AS KINETIC SKYLINE)
  // =========================================================================
  buildScene2_CyberpunkMetropolis() {
    if (this.cityGroup) this.scene.remove(this.cityGroup);
    this.cityGroup = new THREE.Group();
    this.cityGroup.position.set(0, 0, -290);
    this.scene.add(this.cityGroup);

    this.skyscrapers = [];

    // Dark Reflective Ground Grid
    const gridHelper = new THREE.GridHelper(140, 40, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0;
    this.cityGroup.add(gridHelper);

    // 5 Towering Monolithic Skyscrapers for Top Genres
    const genres = (this.data && this.data.topGenres) ? this.data.topGenres.slice(0, 5) : [];
    const genreColors = [0x38bdf8, 0xa855f7, 0x10b981, 0xf43f5e, 0xf59e0b];

    const towerSpacing = 9;
    const startX = -((genres.length - 1) * towerSpacing) / 2;

    genres.forEach((genre, i) => {
      // Skyscraper height directly proportional to percentage
      const height = Math.max(14, (genre.percentage || 20) * 1.35);
      const bGeom = new THREE.BoxGeometry(5.5, height, 5.5);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a10,
        roughness: 0.2,
        metalness: 0.9,
        emissive: genreColors[i],
        emissiveIntensity: 0.22
      });
      const bMesh = new THREE.Mesh(bGeom, bMat);
      const x = startX + i * towerSpacing;
      const z = -25 + (i % 2 === 0 ? -4 : 4);
      bMesh.position.set(x, height / 2, z);

      bMesh.userData = {
        type: 'genre',
        index: i,
        rank: i + 1,
        genre: genre,
        color: genreColors[i]
      };

      // Rooftop Spire & Beacon
      const spireGeom = new THREE.CylinderGeometry(0.1, 0.4, 6);
      const spireMat = new THREE.MeshBasicMaterial({ color: genreColors[i] });
      const spireMesh = new THREE.Mesh(spireGeom, spireMat);
      spireMesh.position.set(0, height / 2 + 3, 0);
      bMesh.add(spireMesh);

      const beaconLight = new THREE.PointLight(genreColors[i], 1.5, 30);
      beaconLight.position.set(0, height / 2 + 6, 0);
      bMesh.add(beaconLight);

      this.cityGroup.add(bMesh);
      this.hoverableObjects.push(bMesh);

      this.skyscrapers.push({
        mesh: bMesh,
        genre: genre,
        color: genreColors[i],
        height: height
      });
    });

    // Digital Audio Rain Particle Matrix
    const rainCount = 900;
    const rainGeom = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    for (let r = 0; r < rainCount; r++) {
      rainPos[r * 3] = (Math.random() - 0.5) * 80;
      rainPos[r * 3 + 1] = Math.random() * 60;
      rainPos[r * 3 + 2] = -50 + Math.random() * 60;
    }
    rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.65,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    this.rainParticles = new THREE.Points(rainGeom, rainMat);
    this.cityGroup.add(this.rainParticles);
  }

  // =========================================================================
  // SCENE 3: THE SONIC SINGULARITY & AURA GRAVITATIONAL CORE
  // =========================================================================
  buildScene3_Singularity() {
    if (this.singularityGroup) this.scene.remove(this.singularityGroup);
    this.singularityGroup = new THREE.Group();
    this.singularityGroup.position.set(0, 0, -440);
    this.scene.add(this.singularityGroup);

    // Center Black Hole Photon Sphere
    const holeGeom = new THREE.SphereGeometry(4.5, 32, 32);
    const holeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.singularityCore = new THREE.Mesh(holeGeom, holeMat);
    this.singularityGroup.add(this.singularityCore);

    // Glowing Event Horizon Photon Ring
    const horizonGeom = new THREE.RingGeometry(4.6, 6.2, 48);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const horizonRing = new THREE.Mesh(horizonGeom, horizonMat);
    horizonRing.rotation.x = Math.PI / 2.3;
    this.singularityGroup.add(horizonRing);

    // Relativistic Accretion Disk Particles in user's Aura Colors
    const auraColors = (this.data && this.data.stats && this.data.stats.auraColors) 
      ? this.data.stats.auraColors 
      : ['#8b5cf6', '#38bdf8', '#c084fc'];

    const particleCount = 2200;
    const diskGeom = new THREE.BufferGeometry();
    const diskPos = new Float32Array(particleCount * 3);
    const diskColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(auraColors[0] || '#8b5cf6');
    const c2 = new THREE.Color(auraColors[1] || '#38bdf8');
    const c3 = new THREE.Color(auraColors[2] || '#ec4899');

    for (let p = 0; p < particleCount; p++) {
      const p3 = p * 3;
      // Spiral accretion formula
      const radius = 6.5 + Math.pow(Math.random(), 2) * 28;
      const angle = Math.random() * Math.PI * 2;
      diskPos[p3] = Math.cos(angle) * radius;
      diskPos[p3 + 1] = (Math.random() - 0.5) * (radius * 0.12);
      diskPos[p3 + 2] = Math.sin(angle) * radius;

      // Color interpolation
      const ratio = Math.random();
      const col = ratio < 0.5 ? c1.clone().lerp(c2, ratio * 2) : c2.clone().lerp(c3, (ratio - 0.5) * 2);
      diskColors[p3] = col.r;
      diskColors[p3 + 1] = col.g;
      diskColors[p3 + 2] = col.b;
    }

    diskGeom.setAttribute('position', new THREE.BufferAttribute(diskPos, 3));
    diskGeom.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));

    const diskMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.accretionDisk = new THREE.Points(diskGeom, diskMat);
    this.accretionDisk.rotation.x = Math.PI / 2.3;
    this.singularityGroup.add(this.accretionDisk);

    // Orbiting DNA Telemetry Torus Ring
    const torusGeom = new THREE.TorusGeometry(26, 0.2, 16, 64);
    const torusMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const dnaRing = new THREE.Mesh(torusGeom, torusMat);
    dnaRing.rotation.x = Math.PI / 3;
    this.singularityGroup.add(dnaRing);
  }

  // =========================================================================
  // SCENE 4: COSMIC ARCHIVE / FINALE SHOWCASE
  // =========================================================================
  buildScene4_FinaleArchive() {
    if (this.finaleGroup) this.scene.remove(this.finaleGroup);
    this.finaleGroup = new THREE.Group();
    this.finaleGroup.position.set(0, 0, -560);
    this.scene.add(this.finaleGroup);

    // Central Floating 3D Octahedral Crystal Artifact
    const octGeom = new THREE.OctahedronGeometry(6.5, 0);
    const octMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true
    });
    this.finaleArtifact = new THREE.Mesh(octGeom, octMat);
    this.finaleGroup.add(this.finaleArtifact);

    // Floating Concentric Orbit Rings
    for (let r = 1; r <= 3; r++) {
      const rGeom = new THREE.TorusGeometry(8 + r * 4, 0.15, 16, 48);
      const rMat = new THREE.MeshBasicMaterial({
        color: r === 1 ? 0x38bdf8 : r === 2 ? 0xc084fc : 0x10b981,
        transparent: true,
        opacity: 0.45
      });
      const ring = new THREE.Mesh(rGeom, rMat);
      ring.rotation.x = (r * Math.PI) / 4;
      ring.rotation.y = (r * Math.PI) / 6;
      this.finaleGroup.add(ring);
    }
  }

  // =========================================================================
  // INTERACTION HANDLERS: SCROLL, TOUCH, HOVER & CLICK
  // =========================================================================
  handleMouseDown(e) {
    if (!this.isOpen) return;
    if (e.target === this.canvas || (this.billboardsLayerEl && e.target === this.billboardsLayerEl)) {
      this.isDragging = true;
      this.hasDragged = false;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      if (this.canvas) this.canvas.style.cursor = 'grabbing';
    }
  }

  handleMouseUp(e) {
    if (this.isDragging) {
      this.isDragging = false;
      if (this.canvas) this.canvas.style.cursor = 'grab';
    }
  }

  handleWheel(e) {
    if (!this.isOpen) return;
    e.preventDefault();

    // In Scene 0: Dolly Zoom like NASA Eyes on the Solar System
    if (this.currentSceneIdx === 0 && !this.isInspecting) {
      if (Math.abs(e.deltaY) < 45) {
        this.targetOrbitRadius = Math.max(16, Math.min(68, this.targetOrbitRadius + e.deltaY * 0.035));
        return;
      }
    }

    // Scroll delta damping for transitioning across chapters
    const delta = e.deltaY * 0.0016;
    this.targetScroll = Math.max(0, Math.min(4.0, this.targetScroll + delta));

    if (this.targetScroll > 0.08 && this.isInspecting) {
      this.resetToSolarSystem();
    }

    // Show speed lines when scrolling fast
    if (Math.abs(delta) > 0.04 && this.speedLinesEl) {
      this.speedLinesEl.classList.add('active');
      clearTimeout(this.speedTimer);
      this.speedTimer = setTimeout(() => {
        if (this.speedLinesEl) this.speedLinesEl.classList.remove('active');
      }, 200);
    }
  }

  handleTouchStart(e) {
    if (e.touches.length > 0) {
      this.touchStartY = e.touches[0].clientY;
      this.dragStart.x = e.touches[0].clientX;
      this.dragStart.y = e.touches[0].clientY;
      this.isDragging = true;
      this.hasDragged = false;
    }
  }

  handleTouchMove(e) {
    if (!this.isOpen || e.touches.length === 0) return;
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    if (this.currentSceneIdx === 0 && this.isDragging) {
      const dx = touchX - this.dragStart.x;
      const dy = touchY - this.dragStart.y;
      if (Math.hypot(dx, dy) > 5) this.hasDragged = true;
      this.targetOrbitTheta -= dx * 0.008;
      this.targetOrbitPhi = Math.max(0.12, Math.min(1.42, this.targetOrbitPhi - dy * 0.008));
      this.dragStart.x = touchX;
      this.dragStart.y = touchY;
      return;
    }

    const delta = (this.touchStartY - touchY) * 0.004;
    this.targetScroll = Math.max(0, Math.min(4.0, this.targetScroll + delta));
    this.touchStartY = touchY;
  }

  handleMouseMove(e) {
    if (!this.isOpen) return;
    this.mouse.screenX = e.clientX;
    this.mouse.screenY = e.clientY;
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Active drag-to-orbit in Scene 0 (NASA Eyes free camera orbit)
    if (this.isDragging && this.currentSceneIdx === 0) {
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      if (Math.hypot(dx, dy) > 4) {
        this.hasDragged = true;
      }
      this.targetOrbitTheta -= dx * 0.006;
      this.targetOrbitPhi = Math.max(0.12, Math.min(1.42, this.targetOrbitPhi - dy * 0.006));
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      return; // Skip raycast during drag
    }

    this.checkRaycastHover();
  }

  handleClick(e) {
    if (!this.isOpen) return;
    if (this.hasDragged) return; // Prevent click firing after drag orbit

    // Raycast on click
    if (this.hoveredObject && this.hoveredObject.userData) {
      const uData = this.hoveredObject.userData;
      if (uData.type === 'planet' && uData.track) {
        this.focusPlanet(uData.index);
        return;
      } else if (uData.type === 'artist' && uData.artist) {
        const matchingTrack = this.data?.topTracks?.find(t => 
          t.artists?.some(a => a.name.toLowerCase() === uData.artist.name.toLowerCase())
        ) || this.data?.topTracks?.[0];
        if (matchingTrack) {
          soundEngine.playTrack(matchingTrack);
          showToast(`Playing Master: ${matchingTrack.name}`, 'info', 2200);
        }
      }
    } else if (this.isInspecting && (e.target === this.canvas || e.target === this.billboardsLayerEl)) {
      this.resetToSolarSystem();
    }
  }

  handleKeyDown(e) {
    if (!this.isOpen) return;
    if (e.key === 'Escape') {
      this.close();
    } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      this.targetScroll = Math.min(4.0, Math.floor(this.targetScroll) + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      this.targetScroll = Math.max(0, Math.ceil(this.targetScroll) - 1);
    } else if (e.key === 'm' || e.key === 'M') {
      this.toggleAudio();
    }
  }

  handleResize() {
    if (!this.renderer || !this.camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Raycast check for hovering on planets, monoliths, and skyscrapers
   */
  checkRaycastHover() {
    if (!this.raycaster || !this.camera || !this.hoverableObjects.length) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hoverableObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (this.hoveredObject !== hit) {
        if (this.hoveredObject) this.unhoverObject(this.hoveredObject);
        this.hoveredObject = hit;
        this.hoverObject(hit);
      }
      this.updateTooltipPosition(hit);
    } else {
      if (this.hoveredObject) {
        this.unhoverObject(this.hoveredObject);
        this.hoveredObject = null;
      }
      this.hideTooltip();
    }
  }

  hoverObject(obj) {
    obj.scale.set(1.2, 1.2, 1.2);
    if (obj.material && obj.material.emissiveIntensity) {
      obj.material.emissiveIntensity = 0.8;
    }
    this.showTooltip(obj);
  }

  unhoverObject(obj) {
    obj.scale.set(1.0, 1.0, 1.0);
    if (obj.material && obj.material.emissiveIntensity) {
      obj.material.emissiveIntensity = 0.25;
    }
  }

  showTooltip(obj) {
    if (!this.tooltipEl || !obj.userData) return;
    const u = obj.userData;

    let contentHtml = '';
    if (u.type === 'planet') {
      const track = u.track;
      const durationMin = track.duration_ms ? `${Math.floor(track.duration_ms / 60000)}m ${Math.floor((track.duration_ms % 60000) / 1000)}s` : '3m 45s';
      const estMinutes = (5 - u.rank + 1) * 320 + 240;
      const img = track.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=150&q=80';
      const artist = track.artists?.map(a => a.name).join(', ') || 'Artist';

      contentHtml = `
        <div class="amaze-tooltip-card">
          <div class="amaze-tooltip-header">
            <span class="amaze-tooltip-rank">ORBIT #${u.rank} • TOP SONG</span>
            <span class="amaze-tooltip-meta">CELESTIAL ARCHIVE</span>
          </div>
          <div class="amaze-tooltip-body">
            <img src="${img}" class="amaze-tooltip-thumb" alt="art">
            <div class="amaze-tooltip-info">
              <span class="amaze-tooltip-track">${track.name}</span>
              <span class="amaze-tooltip-artist">${artist}</span>
            </div>
          </div>
          <div class="amaze-tooltip-stat-row">
            <span>TRACK LENGTH: <b>${durationMin}</b></span>
            <span>EST. STREAMED: <b>${estMinutes}m</b></span>
          </div>
          <button class="amaze-tooltip-btn" id="btn-planet-play">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Play 30s Studio Preview</span>
          </button>
        </div>
      `;
    } else if (u.type === 'artist') {
      const artist = u.artist;
      const img = artist.images?.[0]?.url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=150&q=80';
      const genres = artist.genres?.slice(0, 2).join(' • ') || 'Sonic Artist';

      contentHtml = `
        <div class="amaze-tooltip-card">
          <div class="amaze-tooltip-header">
            <span class="amaze-tooltip-rank">BEACON #${u.rank} • TOP ARTIST</span>
            <span class="amaze-tooltip-meta">MIDNIGHT VOYAGE</span>
          </div>
          <div class="amaze-tooltip-body">
            <img src="${img}" class="amaze-tooltip-thumb" alt="artist">
            <div class="amaze-tooltip-info">
              <span class="amaze-tooltip-track">${artist.name}</span>
              <span class="amaze-tooltip-artist">${genres}</span>
            </div>
          </div>
          <button class="amaze-tooltip-btn" id="btn-planet-play">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>Listen to Catalog Preview</span>
          </button>
        </div>
      `;
    } else if (u.type === 'genre') {
      const genre = u.genre;
      contentHtml = `
        <div class="amaze-tooltip-card">
          <div class="amaze-tooltip-header">
            <span class="amaze-tooltip-rank">SPIRE #${u.rank} • ARCHETYPE</span>
            <span class="amaze-tooltip-meta">NEON SKYLINE</span>
          </div>
          <div class="amaze-tooltip-body">
            <div class="amaze-tooltip-info">
              <span class="amaze-tooltip-track">${genre.name}</span>
              <span class="amaze-tooltip-artist">${genre.percentage}% of Overall Listening</span>
            </div>
          </div>
          <div class="amaze-tooltip-stat-row">
            <span>DENSITY: <b>${genre.count || 8} TRACKS</b></span>
            <span>FREQUENCY: <b>DOMINANT</b></span>
          </div>
        </div>
      `;
    }

    this.tooltipEl.innerHTML = contentHtml;
    this.tooltipEl.classList.add('is-visible');

    const playBtn = this.tooltipEl.querySelector('#btn-planet-play');
    if (playBtn) {
      playBtn.onclick = (e) => {
        e.stopPropagation();
        if (u.type === 'planet' && u.track) soundEngine.playTrack(u.track);
        else if (u.type === 'artist' && this.data?.topTracks?.[0]) soundEngine.playTrack(this.data.topTracks[0]);
      };
    }

    if (this.reticleEl) {
      this.reticleEl.classList.add('active');
    }
  }

  hideTooltip() {
    if (this.tooltipEl) this.tooltipEl.classList.remove('is-visible');
    if (this.reticleEl) this.reticleEl.classList.remove('active');
  }

  updateTooltipPosition(obj) {
    if (!this.tooltipEl || !this.camera) return;

    // Project 3D vector to 2D screen coordinate
    const pos = new THREE.Vector3();
    obj.getWorldPosition(pos);
    pos.project(this.camera);

    const screenX = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-(pos.y * 0.5) + 0.5) * window.innerHeight;

    this.tooltipEl.style.left = `${screenX}px`;
    this.tooltipEl.style.top = `${screenY}px`;

    if (this.reticleEl) {
      this.reticleEl.style.left = `${screenX}px`;
      this.reticleEl.style.top = `${screenY}px`;
    }
  }

  // =========================================================================
  // RENDER LOOP & PHYSICS SIMULATION
  // =========================================================================
  startLoop() {
    if (this.animId) cancelAnimationFrame(this.animId);
    const animate = () => {
      this.animId = requestAnimationFrame(animate);
      this.render();
    };
    animate();
  }

  stopLoop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  render() {
    if (!this.renderer || !this.scene || !this.camera) return;

    const delta = this.clock ? this.clock.getDelta() : 0.016;
    const time = this.clock ? this.clock.getElapsedTime() : 0;

    // Smooth camera scroll interpolation (Spring Damping)
    this.scrollProgress += (this.targetScroll - this.scrollProgress) * 0.075;
    this.currentSceneIdx = Math.min(4, Math.floor(this.scrollProgress + 0.3));

    if (this.scrollProgress < 0.08) {
      // Scene 0: Interactive NASA Eyes Orbit Camera
      this.orbitTheta += (this.targetOrbitTheta - this.orbitTheta) * 0.08;
      this.orbitPhi += (this.targetOrbitPhi - this.orbitPhi) * 0.08;
      this.orbitRadius += (this.targetOrbitRadius - this.orbitRadius) * 0.08;
      if (!this.currentLookAt) this.currentLookAt = new THREE.Vector3(0, 0, 0);
      if (!this.targetLookAt) this.targetLookAt = new THREE.Vector3(0, 0, 0);
      this.currentLookAt.lerp(this.targetLookAt, 0.08);

      const camX = this.currentLookAt.x + this.orbitRadius * Math.sin(this.orbitPhi) * Math.sin(this.orbitTheta);
      const camY = this.currentLookAt.y + this.orbitRadius * Math.cos(this.orbitPhi);
      const camZ = this.currentLookAt.z + this.orbitRadius * Math.sin(this.orbitPhi) * Math.cos(this.orbitTheta);

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.currentLookAt);

      // Stationary Celestial Bodies: only axial spin in place (Rock still!)
      if (this.solarSystemGroup) {
        this.planets.forEach((p) => {
          p.mesh.rotation.y += 0.003;
        });
      }

      this.updateBillboardProjections();
      if (this.selectorBarEl) this.selectorBarEl.style.display = 'flex';
      this.scene.fog.density = 0.002;
    } else {
      // Transitioning across scenes 1-4 (The Boat / Midnight Voyage, etc.)
      const sceneIdx = Math.min(3, Math.floor(this.scrollProgress));
      const nextIdx = Math.min(4, sceneIdx + 1);
      const frac = this.scrollProgress - sceneIdx;

      const curScene = SCENES[sceneIdx];
      const nxtScene = SCENES[nextIdx];

      // Smoothly interpolate camera position & lookAt
      const targetCamX = curScene.cameraX + (nxtScene.cameraX - curScene.cameraX) * frac + this.mouse.x * 2.5;
      const targetCamY = curScene.cameraY + (nxtScene.cameraY - curScene.cameraY) * frac - this.mouse.y * 1.5;
      const targetCamZ = curScene.cameraZ + (nxtScene.cameraZ - curScene.cameraZ) * frac;

      this.camera.position.x += (targetCamX - this.camera.position.x) * 0.08;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 0.08;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.08;

      const lookX = curScene.lookAt.x + (nxtScene.lookAt.x - curScene.lookAt.x) * frac;
      const lookY = curScene.lookAt.y + (nxtScene.lookAt.y - curScene.lookAt.y) * frac;
      const lookZ = curScene.lookAt.z + (nxtScene.lookAt.z - curScene.lookAt.z) * frac;
      this.camera.lookAt(lookX, lookY, lookZ);

      // Update Fog Density
      const targetFog = curScene.fogDensity + (nxtScene.fogDensity - curScene.fogDensity) * frac;
      this.scene.fog.density = targetFog;

      this.hideBillboardTags();
      if (this.selectorBarEl) this.selectorBarEl.style.display = 'none';
      this.hideInspectorDrawer();
    }

    // Scene 1: Bioluminescent Ocean Wave Vertex Displacement & Boat Sway
    if (this.oceanPlane && this.oceanPlane.geometry) {
      const geom = this.oceanPlane.geometry;
      const posAttr = geom.attributes.position;
      const initialY = geom.userData.initialY;
      const count = geom.userData.count;

      for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        // Dual Gerstner sinusoidal wave formula
        const wave = Math.sin(x * 0.12 + time * 1.8) * 1.2 + Math.cos(z * 0.16 + time * 1.4) * 0.9;
        posAttr.setY(i, initialY[i] + wave);
      }
      posAttr.needsUpdate = true;

      // Boat Pitch and Roll
      if (this.boatMesh) {
        const boatWave = Math.sin(time * 1.8) * 0.6;
        this.boatMesh.position.y = 0.8 + boatWave;
        this.boatMesh.rotation.z = Math.sin(time * 1.5) * 0.08;
        this.boatMesh.rotation.x = Math.cos(time * 1.2) * 0.06;
      }

      // Rotate artist monolith halos
      this.artistMonoliths.forEach((m, idx) => {
        if (m.halo) m.halo.rotation.z += 0.02;
        m.group.position.y = m.baseY + Math.sin(time * 1.4 + idx) * 0.4;
      });
    }

    // Scene 2: Falling Cyberpunk Audio Rain
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position;
      for (let r = 0; r < pos.count; r++) {
        let y = pos.getY(r) - 0.8;
        if (y < 0) y = 60;
        pos.setY(r, y);
      }
      pos.needsUpdate = true;
    }

    // Scene 3: Relativistic Accretion Disk Rotation & Pulsing Core
    if (this.accretionDisk) {
      this.accretionDisk.rotation.z += 0.008;
    }
    if (this.singularityCore) {
      // Pulse to user BPM
      const bpm = (this.data && this.data.stats && this.data.stats.tempoBpm) || 120;
      const pulseSpeed = (bpm / 60) * Math.PI * 2;
      const scale = 1.0 + Math.sin(time * pulseSpeed) * 0.05;
      this.singularityCore.scale.set(scale, scale, scale);
    }

    // Scene 4: Rotating Finale Crystalline Octahedron
    if (this.finaleArtifact) {
      this.finaleArtifact.rotation.x += 0.01;
      this.finaleArtifact.rotation.y += 0.015;
    }

    // Update HUD & Telemetry
    const activeIdx = Math.round(this.scrollProgress);
    if (activeIdx !== this.currentSceneIdx) {
      this.currentSceneIdx = activeIdx;
      this.updateHUD(activeIdx);
    }

    // Toggle Grand Finale HTML Card when reaching Scene 4
    if (this.finaleContainerEl) {
      if (this.scrollProgress >= 3.65) {
        this.renderFinaleCard();
        this.finaleContainerEl.classList.add('is-active');
      } else {
        this.finaleContainerEl.classList.remove('is-active');
      }
    }

    // Render WebGL frame
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update Top Bar & Telemetry HUD elements
   */
  updateHUD(sceneIdx) {
    const sc = SCENES[sceneIdx] || SCENES[0];
    if (this.sceneNameEl) this.sceneNameEl.textContent = sc.title;
    if (this.sceneSubEl) this.sceneSubEl.textContent = sc.sub;
    if (this.telemCoordsEl) this.telemCoordsEl.textContent = sc.telemCoords;
    if (this.telemVelEl) this.telemVelEl.textContent = sc.telemVelocity;

    // Update Nav Rail markers
    if (this.sceneNavEl) {
      const items = this.sceneNavEl.querySelectorAll('.amaze-nav-item');
      items.forEach((item, idx) => {
        item.classList.toggle('active', idx === sceneIdx);
      });
    }

    // Play subtle harmonic frequency shift in ambient synth
    this.modulateAmbientScene(sceneIdx);
  }

  /**
   * Render Grand Finale summary card
   */
  renderFinaleCard() {
    if (!this.finaleContainerEl) return;
    const d = this.data;
    const user = d?.user?.display_name || 'Soulseekr Archivist';
    const topSong = d?.topTracks?.[0]?.name || 'Starboy';
    const topArtist = d?.topArtists?.[0]?.name || 'The Weeknd';
    const topGenre = d?.stats?.topGenre || 'Neo-Psychedelia';
    const totalMinutes = d?.stats?.totalMinutes ? d.stats.totalMinutes.toLocaleString() : '48,320';
    const obscurityTier = d?.stats?.obscurityTier || 'Underground Crate Digger';
    const aura = d?.stats?.auraTitle || 'Subterranean Velvet';

    this.finaleContainerEl.innerHTML = `
      <div class="amaze-finale-card">
        <span class="amaze-finale-badge">${aura.toUpperCase()}</span>
        <h2 class="amaze-finale-title">${user}</h2>
        <p class="amaze-finale-sub">You have navigated across the outer edges of your music multiverse. Here is your cosmic footprint:</p>

        <div class="amaze-finale-stats-grid">
          <div class="amaze-finale-stat-box">
            <span class="amaze-finale-stat-label">#1 Celestial Track</span>
            <span class="amaze-finale-stat-val">${topSong}</span>
          </div>
          <div class="amaze-finale-stat-box">
            <span class="amaze-finale-stat-label">#1 Guiding Artist</span>
            <span class="amaze-finale-stat-val">${topArtist}</span>
          </div>
          <div class="amaze-finale-stat-box">
            <span class="amaze-finale-stat-label">Dominant Frequency</span>
            <span class="amaze-finale-stat-val">${topGenre}</span>
          </div>
          <div class="amaze-finale-stat-box">
            <span class="amaze-finale-stat-label">Time Traversed</span>
            <span class="amaze-finale-stat-val">${totalMinutes} Mins</span>
          </div>
        </div>

        <div class="amaze-finale-actions">
          <button class="amaze-finale-btn-primary" id="btn-amaze-restart">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Restart Journey
          </button>
          <button class="amaze-finale-btn-secondary" id="btn-amaze-exit">
            Exit to Studio
          </button>
        </div>
      </div>
    `;

    const btnRestart = this.finaleContainerEl.querySelector('#btn-amaze-restart');
    if (btnRestart) {
      btnRestart.onclick = () => {
        this.targetScroll = 0;
      };
    }
    const btnExit = this.finaleContainerEl.querySelector('#btn-amaze-exit');
    if (btnExit) {
      btnExit.onclick = () => {
        this.close();
      };
    }
  }

  // =========================================================================
  // AMBIENT GENERATIVE SYNTHESIZER (WEB AUDIO API)
  // =========================================================================
  startAmbientAudio() {
    if (this.isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      if (this.ambientGain) return; // already playing

      this.ambientGain = this.audioCtx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.08, this.audioCtx.currentTime + 3);
      this.ambientGain.connect(this.audioCtx.destination);

      // Low frequency sub-drone chord (Frequencies around 55Hz - 110Hz)
      const freqs = [55, 82.4, 110, 164.8];
      this.ambientOscs = freqs.map((f, i) => {
        const osc = this.audioCtx.createOscillator();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, this.audioCtx.currentTime);

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);

        osc.connect(filter);
        filter.connect(this.ambientGain);
        osc.start();
        return osc;
      });
    } catch (err) {
      console.warn('Web Audio Ambient error:', err);
    }
  }

  stopAmbientAudio() {
    if (this.ambientGain && this.audioCtx) {
      try {
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.audioCtx.currentTime);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.6);
        setTimeout(() => {
          this.ambientOscs.forEach(o => {
            try { o.stop(); o.disconnect(); } catch (e) {}
          });
          this.ambientOscs = [];
          if (this.ambientGain) {
            this.ambientGain.disconnect();
            this.ambientGain = null;
          }
        }, 700);
      } catch (e) {}
    }
  }

  modulateAmbientScene(sceneIdx) {
    if (!this.audioCtx || !this.ambientOscs.length) return;
    const baseChords = [
      [55, 82.4, 110, 164.8],    // 0: Deep space A minor
      [65.4, 98, 130.8, 196],     // 1: Ocean C major swell
      [58.27, 87.3, 116.5, 174.6],// 2: Cyberpunk Bb minor
      [49, 73.4, 98, 146.8],      // 3: Singularity G deep sub
      [65.4, 82.4, 110, 164.8]    // 4: Archive resolution
    ];
    const chord = baseChords[sceneIdx] || baseChords[0];
    const now = this.audioCtx.currentTime;
    this.ambientOscs.forEach((osc, i) => {
      if (chord[i]) {
        osc.frequency.exponentialRampToValueAtTime(chord[i], now + 1.2);
      }
    });
  }

  toggleAudio() {
    this.isMuted = !this.isMuted;
    if (this.btnAudio) {
      this.btnAudio.classList.toggle('is-active', !this.isMuted);
      this.btnAudio.title = this.isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)';
      this.btnAudio.innerHTML = this.isMuted
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
    }

    if (this.isMuted) {
      this.stopAmbientAudio();
      soundEngine.stop();
      showToast('Soundscape Muted', 'info', 1500);
    } else {
      this.startAmbientAudio();
      showToast('Soundscape Active', 'info', 1500);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.modal.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  }
}

export const amazeMe = new AmazeMeEngine();
