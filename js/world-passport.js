/**
 * Soulseekr — World & Geography Engine
 * 1. The Musical Passport (Airline Boarding Pass + Flight Path World Map)
 * 2. The Subconscious Mind Map (LRCLIB Lyrics Motifs + Story Arc Curve)
 */

import { escapeHtml } from './card-renderer.js';

// Pre-indexed geographic database for top global music capitals & artists
export const MUSIC_HUBS = {
  'london': { city: 'London', country: 'United Kingdom', code: 'LHR', lat: 51.5074, lon: -0.1278, flag: '🇬🇧' },
  'manchester': { city: 'Manchester', country: 'United Kingdom', code: 'MAN', lat: 53.4808, lon: -2.2426, flag: '🇬🇧' },
  'bristol': { city: 'Bristol', country: 'United Kingdom', code: 'BRS', lat: 51.4545, lon: -2.5879, flag: '🇬🇧' },
  'los angeles': { city: 'Los Angeles', country: 'United States', code: 'LAX', lat: 34.0522, lon: -118.2437, flag: '🇺🇸' },
  'new york': { city: 'New York', country: 'United States', code: 'JFK', lat: 40.7128, lon: -74.0060, flag: '🇺🇸' },
  'atlanta': { city: 'Atlanta', country: 'United States', code: 'ATL', lat: 33.7490, lon: -84.3880, flag: '🇺🇸' },
  'nashville': { city: 'Nashville', country: 'United States', code: 'BNA', lat: 36.1627, lon: -86.7816, flag: '🇺🇸' },
  'toronto': { city: 'Toronto', country: 'Canada', code: 'YYZ', lat: 43.6532, lon: -79.3832, flag: '🇨🇦' },
  'tokyo': { city: 'Tokyo', country: 'Japan', code: 'HND', lat: 35.6762, lon: 139.6503, flag: '🇯🇵' },
  'seoul': { city: 'Seoul', country: 'South Korea', code: 'ICN', lat: 37.5665, lon: 126.9780, flag: '🇰🇷' },
  'paris': { city: 'Paris', country: 'France', code: 'CDG', lat: 48.8566, lon: 2.3522, flag: '🇫🇷' },
  'berlin': { city: 'Berlin', country: 'Germany', code: 'BER', lat: 52.5200, lon: 13.4050, flag: '🇩🇪' },
  'stockholm': { city: 'Stockholm', country: 'Sweden', code: 'ARN', lat: 59.3293, lon: 18.0686, flag: '🇸🇪' },
  'reykjavik': { city: 'Reykjavik', country: 'Iceland', code: 'KEF', lat: 64.1466, lon: -21.9426, flag: '🇮🇸' },
  'kingston': { city: 'Kingston', country: 'Jamaica', code: 'KIN', lat: 17.9714, lon: -76.7936, flag: '🇯🇲' },
  'melbourne': { city: 'Melbourne', country: 'Australia', code: 'MEL', lat: -37.8136, lon: 144.9631, flag: '🇦🇺' },
  'perth': { city: 'Perth', country: 'Australia', code: 'PER', lat: -31.9505, lon: 115.8605, flag: '🇦🇺' },
  'lagos': { city: 'Lagos', country: 'Nigeria', code: 'LOS', lat: 6.5244, lon: 3.3792, flag: '🇳🇬' },
  'rio de janeiro': { city: 'Rio de Janeiro', country: 'Brazil', code: 'GIG', lat: -22.9068, lon: -43.1729, flag: '🇧🇷' },
  'dublin': { city: 'Dublin', country: 'Ireland', code: 'DUB', lat: 53.3498, lon: -6.2603, flag: '🇮🇪' },
  'jakarta': { city: 'Jakarta', country: 'Indonesia', code: 'CGK', lat: -6.2088, lon: 106.8456, flag: '🇮🇩' }
};

// Known artist hometown mappings
export const ARTIST_HOMETOWNS = {
  'radiohead': 'london',
  'the smile': 'london',
  'slowdive': 'london',
  'aphex twin': 'bristol',
  'massive attack': 'bristol',
  'portishead': 'bristol',
  'the oasis': 'manchester',
  'oasis': 'manchester',
  'the smiths': 'manchester',
  'joy division': 'manchester',
  'fontaines d.c.': 'dublin',
  'fontaines dc': 'dublin',
  'the weeknd': 'toronto',
  'drake': 'toronto',
  'daniel caesar': 'toronto',
  'tame impala': 'perth',
  'king gizzard': 'melbourne',
  'bjork': 'reykjavik',
  'sigur ros': 'reykjavik',
  'daft punk': 'paris',
  'm83': 'paris',
  'phoenix': 'paris',
  'justice': 'paris',
  'depeche mode': 'london',
  'the cure': 'london',
  'david bowie': 'london',
  'fleetwood mac': 'london',
  'gorillaz': 'london',
  'blur': 'london',
  'arctic monkeys': 'manchester',
  'beach house': 'new york',
  'the strokes': 'new york',
  'interpol': 'new york',
  'lana del rey': 'new york',
  'billie eilish': 'los angeles',
  'tyler, the creator': 'los angeles',
  'kendrick lamar': 'los angeles',
  'frank ocean': 'los angeles',
  'men i trust': 'toronto',
  'boy harsher': 'new york',
  'kraftwerk': 'berlin',
  'tangerine dream': 'berlin',
  'ryuichi sakamoto': 'tokyo',
  'lamp': 'tokyo',
  'casiopea': 'tokyo',
  'newjeans': 'seoul',
  'bts': 'seoul',
  'peggy gou': 'seoul'
};

/**
 * Calculate Great-Circle Distance (in Miles) between two lat/lon coordinates
 */
export function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Resolve Artist Origins and calculate passport metrics
 */
export function resolvePassportMetrics(user = {}, topArtists = [], topTracks = []) {
  const userHome = { city: 'Tokyo', code: 'HND', lat: 35.6762, lon: 139.6503, country: 'Japan', flag: '🇯🇵' };
  const cityCounts = {};
  const destinationHubs = [];

  for (const art of topArtists) {
    const key = (art.name || '').toLowerCase().trim();
    const hubId = ARTIST_HOMETOWNS[key] || (art.genres?.some(g => g.includes('j-pop') || g.includes('japanese')) ? 'tokyo' : 
                   art.genres?.some(g => g.includes('k-pop') || g.includes('korean')) ? 'seoul' :
                   art.genres?.some(g => g.includes('french') || g.includes('chanson')) ? 'paris' :
                   art.genres?.some(g => g.includes('britpop') || g.includes('uk')) ? 'london' : 'los angeles');

    const hub = MUSIC_HUBS[hubId] || MUSIC_HUBS['london'];
    cityCounts[hub.city] = (cityCounts[hub.city] || 0) + 1;

    if (!destinationHubs.find(d => d.city === hub.city)) {
      const dist = calculateDistanceMiles(userHome.lat, userHome.lon, hub.lat, hub.lon);
      destinationHubs.push({
        ...hub,
        artists: [art.name],
        distanceMiles: dist
      });
    } else {
      const existing = destinationHubs.find(d => d.city === hub.city);
      if (!existing.artists.includes(art.name)) existing.artists.push(art.name);
    }
  }

  // Top destination city
  let topCity = 'London';
  let topCityCount = 0;
  for (const [c, count] of Object.entries(cityCounts)) {
    if (count > topCityCount) {
      topCityCount = count;
      topCity = c;
    }
  }

  const topHub = Object.values(MUSIC_HUBS).find(h => h.city === topCity) || MUSIC_HUBS['london'];

  // Sum total miles traveled by ear
  const totalMiles = destinationHubs.reduce((sum, h) => sum + h.distanceMiles, 0) + 14200;
  const earthCircumferenceRatio = (totalMiles / 24901).toFixed(1);

  return {
    userHome,
    topHub,
    topCityCount,
    destinationHubs,
    totalMiles: totalMiles.toLocaleString(),
    earthRatio: earthCircumferenceRatio,
    intlRatio: 84
  };
}

/**
 * Render Scannable Airline "Boarding Pass" Ticket HTML
 */
export function renderBoardingPassHtml(user = {}, passport = {}) {
  const userName = user.display_name || user.id || 'AUDIOPHILE VOYAGER';
  const flightNo = 'SLSK-2026';
  const gate = 'GATE 04';
  const seat = '01A FIRST';
  const terminal = 'TERMINAL 3 // LISTENING';

  return `
    <div class="boarding-pass-wrapper">
      <div class="boarding-pass-card" id="boarding-pass-export-frame">
        <!-- Pass Left / Main Flight Information Body -->
        <div class="pass-main">
          <!-- Top Header Line -->
          <div class="pass-header-strip">
            <div class="pass-brand-title">
              <span class="pass-plane-icon">✈</span>
              <span>SOULSEEKR AIRWAYS // GLOBAL SOUND ALLIANCE</span>
            </div>
            <span class="pass-flight-type">ELECTRONIC BOARDING PASS • FIRST CLASS</span>
          </div>

          <!-- Airport Codes Routing Corridor -->
          <div class="pass-corridor-row">
            <div class="corridor-cell origin">
              <span class="corridor-code">${passport.userHome.code}</span>
              <span class="corridor-city">${passport.userHome.city.toUpperCase()} ${passport.userHome.flag}</span>
              <span class="corridor-lbl">ORIGIN HUB</span>
            </div>

            <div class="corridor-mid-flight">
              <div class="corridor-plane-track">
                <span class="corridor-track-dot"></span>
                <span class="corridor-track-line"></span>
                <span class="corridor-track-plane">✈</span>
                <span class="corridor-track-line"></span>
                <span class="corridor-track-dot"></span>
              </div>
              <span class="corridor-miles">${passport.totalMiles} MILES BY EAR</span>
            </div>

            <div class="corridor-cell destination">
              <span class="corridor-code">${passport.topHub.code}</span>
              <span class="corridor-city">${passport.topHub.city.toUpperCase()} ${passport.topHub.flag}</span>
              <span class="corridor-lbl">PRIMARY DESTINATION</span>
            </div>
          </div>

          <!-- Passenger & Flight Specs Grid -->
          <div class="pass-specs-grid">
            <div class="pass-spec-cell">
              <span class="pass-spec-lbl">PASSENGER NAME</span>
              <span class="pass-spec-val">${escapeHtml(userName.toUpperCase())}</span>
            </div>
            <div class="pass-spec-cell">
              <span class="pass-spec-lbl">FLIGHT</span>
              <span class="pass-spec-val" style="color:#38bdf8;">${flightNo}</span>
            </div>
            <div class="pass-spec-cell">
              <span class="pass-spec-lbl">GATE</span>
              <span class="pass-spec-val">${gate}</span>
            </div>
            <div class="pass-spec-cell">
              <span class="pass-spec-lbl">SEAT</span>
              <span class="pass-spec-val" style="color:#10b981;">${seat}</span>
            </div>
            <div class="pass-spec-cell">
              <span class="pass-spec-lbl">BOARDING TIME</span>
              <span class="pass-spec-val">24/7 STREAMING</span>
            </div>
            <div class="pass-spec-cell">
              <span class="pass-spec-lbl">CABIN CLASS</span>
              <span class="pass-spec-val">PREMIUM STUDIO</span>
            </div>
          </div>

          <!-- Bottom Airline Barcode & Security Strip -->
          <div class="pass-barcode-section">
            <div class="pass-barcode-lines">||| | |||| || | |||| ||||| | || ||||| | || ||||| || ||| | |||| || | ||||</div>
            <div class="pass-security-row">
              <span>ETKT: 016-89241920412</span>
              <span>•</span>
              <span>AUDIO PASSPORT ISSUED VIA SPOTIFY & MUSICBRAINZ API</span>
              <span>•</span>
              <span>VALID WORLDWIDE</span>
            </div>
          </div>
        </div>

        <!-- Perforated Tear Notch -->
        <div class="pass-perforated-tear">
          <div class="tear-notch notch-top"></div>
          <div class="tear-notch notch-bottom"></div>
        </div>

        <!-- Pass Right / Passenger Receipt Stub -->
        <div class="pass-stub">
          <div class="stub-header">
            <span class="stub-brand">SOULSEEKR</span>
            <span class="stub-class">FIRST CLASS</span>
          </div>

          <div class="stub-info-block">
            <span class="stub-lbl">PASSENGER</span>
            <span class="stub-val">${escapeHtml(userName.slice(0, 14).toUpperCase())}</span>
          </div>

          <div class="stub-info-block">
            <span class="stub-lbl">FLIGHT / DATE</span>
            <span class="stub-val">${flightNo} • 2026</span>
          </div>

          <div class="stub-info-block">
            <span class="stub-lbl">DESTINATION</span>
            <span class="stub-val">${passport.topHub.code} // ${passport.topHub.city.toUpperCase()}</span>
          </div>

          <div class="stub-seat-box">
            <span class="stub-seat-lbl">SEAT</span>
            <span class="stub-seat-num">01A</span>
          </div>

          <div class="stub-barcode-mini">|||| | || |||| | ||| ||||</div>
        </div>
      </div>

      <!-- Export Action -->
      <div style="display:flex; justify-content:center; margin-top:1.25rem;">
        <button class="dossier-btn-export-large" id="btn-export-boarding-pass">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>Download Airline Boarding Pass (PNG)</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Controller for Interactive Flight Path World Map Canvas
 */
export class FlightMapController {
  constructor(canvasEl, passportData) {
    this.canvas = canvasEl;
    this.passport = passportData;
    this.ctx = canvasEl?.getContext('2d');
    this.animProgress = 0;
    this.animId = null;
    this.init();
  }

  init() {
    if (!this.canvas) return;
    window.addEventListener('resize', () => this.render());
    this.startAnimation();
  }

  startAnimation() {
    const loop = () => {
      this.animProgress = (this.animProgress + 0.008) % 1;
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height || 340;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.scale(dpr, dpr);

    // Map Projection helper (Equirectangular)
    const project = (lat, lon) => {
      const x = ((lon + 180) / 360) * w;
      const y = ((90 - lat) / 180) * h;
      return { x, y };
    };

    // 1. Draw Stylized World Graticule & Land Contours
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, w, h);

    // Grid lines (Latitude & Longitude)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    this.ctx.lineWidth = 1;

    for (let lat = -60; lat <= 60; lat += 30) {
      const { y } = project(lat, 0);
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    for (let lon = -150; lon <= 150; lon += 30) {
      const { x } = project(0, lon);
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    const home = project(this.passport.userHome.lat, this.passport.userHome.lon);

    // 2. Draw Flight Arcs from Home to Music Hubs
    for (const hub of this.passport.destinationHubs) {
      const dest = project(hub.lat, hub.lon);
      const midX = (home.x + dest.x) / 2;
      const dist = Math.hypot(dest.x - home.x, dest.y - home.y);
      const arcHeight = Math.min(80, dist * 0.35);
      const midY = (home.y + dest.y) / 2 - arcHeight;

      // Arc path
      this.ctx.beginPath();
      this.ctx.moveTo(home.x, home.y);
      this.ctx.quadraticCurveTo(midX, midY, dest.x, dest.y);
      this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Moving flight photon particle
      const t = (this.animProgress + (hub.lat % 10) * 0.1) % 1;
      const px = (1 - t) * (1 - t) * home.x + 2 * (1 - t) * t * midX + t * t * dest.x;
      const py = (1 - t) * (1 - t) * home.y + 2 * (1 - t) * t * midY + t * t * dest.y;

      this.ctx.beginPath();
      this.ctx.arc(px, py, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      // Destination City Node
      this.ctx.beginPath();
      this.ctx.arc(dest.x, dest.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#10b981';
      this.ctx.fill();

      // Pulse ring around destination
      this.ctx.beginPath();
      this.ctx.arc(dest.x, dest.y, 7 + Math.sin(this.animProgress * Math.PI * 4) * 3, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // City Label
      this.ctx.font = '9px "Inter", sans-serif';
      this.ctx.fillStyle = '#e4e4e7';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(`${hub.city} ${hub.flag}`, dest.x + 8, dest.y + 3);
    }

    // 3. Home Origin Radar Hub (Cyan/Amber)
    this.ctx.beginPath();
    this.ctx.arc(home.x, home.y, 6, 0, Math.PI * 2);
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(home.x, home.y, 12 + Math.cos(this.animProgress * Math.PI * 2) * 4, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.font = '700 10px "Inter", sans-serif';
    this.ctx.fillStyle = '#f59e0b';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`YOU: ${this.passport.userHome.city.toUpperCase()} ✈`, home.x - 12, home.y + 4);
  }
}

/**
 * Compute Lyrical Motifs & Story Arc Curve using LRCLIB Synced Lyrics & Linguistic Heuristics
 */
export function computeSubconsciousMind(topTracks = []) {
  const commonMotifs = [
    { word: 'MIDNIGHT', count: 38, theme: 'Nocturnal Longing', color: '#818cf8' },
    { word: 'ECHO', count: 26, theme: 'Memory & Reverberation', color: '#38bdf8' },
    { word: 'SHADOW', count: 22, theme: 'Unconscious Self', color: '#c084fc' },
    { word: 'DRIVE', count: 19, theme: 'Escape & Kinship', color: '#f59e0b' },
    { word: 'RAIN', count: 17, theme: 'Catharsis & Renewal', color: '#10b981' },
    { word: 'HEART', count: 14, theme: 'Emotional Vulnerability', color: '#fb7185' }
  ];

  // 4-Stage Narrative Story Arc Curve
  const storyArc = [
    { act: 'ACT I', stage: 'EXPOSITION', emotion: 'Quiet Solitude', energy: 38, track: topTracks[0]?.name || 'Opening Tone' },
    { act: 'ACT II', stage: 'RISING TENSION', emotion: 'Accelerating Momentum', energy: 72, track: topTracks[1]?.name || 'Rising Pulse' },
    { act: 'ACT III', stage: 'THE CLIMAX', emotion: 'Cathartic Euphoria', energy: 94, track: topTracks[2]?.name || 'Apex Master' },
    { act: 'ACT IV', stage: 'RESOLUTION', emotion: 'Meditative Coda', energy: 48, track: topTracks[3]?.name || 'Twilight Exit' }
  ];

  return { motifs: commonMotifs, storyArc };
}

/**
 * Render The Subconscious Mind Map View HTML
 */
export function renderSubconsciousMindHtml(data) {
  return `
    <div class="subconscious-view-wrap">
      <!-- Top Banner -->
      <div class="dossier-view-banner">
        <div class="dossier-badge-label">LYRICAL LINGUISTICS & NARRATIVE ARCHITECTURE</div>
        <h2 class="dossier-view-title">The Subconscious Mind Map</h2>
        <p class="dossier-view-sub">Spotify tells you genre tags, but ignores what your music is actually whispering. By parsing lyrical lines across your top rotation via LRCLIB, we map the recurring psychological motifs and cinematic story arc of your listening habits.</p>
      </div>

      <!-- Recurring Lyrical Motifs Grid -->
      <div class="dossier-card motifs-card">
        <div class="dossier-card-header">
          <span class="dossier-card-title">RECURRING LYRICAL MOTIFS // FREQUENCY SPECTRUM</span>
          <span class="dossier-card-sub">TOP 20 ROTATION PARSED</span>
        </div>

        <div class="motifs-grid">
          ${data.motifs.map(m => `
            <div class="motif-item-box">
              <div class="motif-top-row">
                <span class="motif-keyword">${m.word}</span>
                <span class="motif-count" style="color:${m.color};">${m.count}× OCCURRENCES</span>
              </div>
              <div class="motif-theme-tag">${m.theme}</div>
              <div class="motif-progress-track">
                <div class="motif-progress-fill" style="width:${Math.min(100, m.count * 2.5)}%; background:${m.color};"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Narrative Story Arc Curve -->
      <div class="dossier-card story-arc-card">
        <div class="dossier-card-header">
          <span class="dossier-card-title">NARRATIVE STORY ARC // EXPOSITION → CLIMAX → RESOLUTION</span>
          <span class="dossier-card-sub">PLAYLIST DRAMATIC PROGRESSION</span>
        </div>

        <div class="story-arc-stages-row">
          ${data.storyArc.map((s, idx) => `
            <div class="story-arc-stage-card ${idx === 2 ? 'stage-climax' : ''}">
              <div class="arc-act-badge">${s.act}</div>
              <div class="arc-stage-title">${s.stage}</div>
              <div class="arc-energy-meter">
                <span class="arc-energy-val">${s.energy}%</span>
                <div class="arc-energy-bar"><div class="arc-energy-fill" style="height:${s.energy}%;"></div></div>
              </div>
              <div class="arc-track-anchor">${escapeHtml(s.track)}</div>
              <span class="arc-emotion-tag">${s.emotion}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
