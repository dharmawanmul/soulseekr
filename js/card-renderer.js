/**
 * Card Renderer Engine
 * Generates the 5 distinct, high-impact experiential music cards:
 * 1. Festival Lineup Poster (Coachella / Glastonbury Style)
 * 2. Sound DNA Aurora (Cosmic Glassmorphism + Audio Vibe Matrix)
 * 3. Retro Cassette Mixtape (Interactive spinning spools + J-Card)
 * 4. 8-Bit Arcade High-Score (Pixel Art + CRT scanlines)
 * 5. Thermal Receipt 2.0 (Upgraded jagged paper + barcode + vibe tax)
 */

export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

export function getTimeRangeLabel(timeRange) {
  switch (timeRange) {
    case 'short_term': return 'PAST 4 WEEKS';
    case 'medium_term': return 'LAST 6 MONTHS';
    case 'long_term': return 'ALL-TIME CLASSICS';
    case 'custom': return 'CUSTOM SELECTION';
    default: return 'RECENT ROTATION';
  }
}

function getIndicator(trackId, playbackState) {
  const isMatch = playbackState && (
    (typeof playbackState === 'string' && playbackState === trackId) ||
    (typeof playbackState === 'object' && playbackState.trackId === trackId)
  );

  if (!isMatch) {
    return '<span class="play-hint">▶</span>';
  }

  if (typeof playbackState === 'object' && playbackState.isLoading) {
    return '<span class="mini-spinner" title="Loading audio..."></span>';
  }

  return '<span class="mini-eq"><span class="bar"></span><span class="bar"></span><span class="bar"></span></span>';
}

function isTrackActive(trackId, playbackState) {
  if (!playbackState) return false;
  if (typeof playbackState === 'string') return playbackState === trackId;
  return playbackState.trackId === trackId;
}

/**
 * Render Festival Lineup Card
 */
export function renderFestivalCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Audiophile' };
  const artists = data.topArtists || [];
  const tracks = data.topTracks || [];
  const rangeLabel = getTimeRangeLabel(timeRange);

  const headliner = artists[0] ? artists[0].name.toUpperCase() : (tracks[0]?.artists[0]?.name?.toUpperCase() || 'THE WEEKND');
  const subHeadliners = artists.slice(1, 3).map(a => a.name.toUpperCase()).join(' • ') || 'DAFT PUNK • M83';
  const supporting = artists.slice(3, 5).map(a => a.name.toUpperCase()).join(' — ') || 'DUA LIPA — ARCTIC MONKEYS';

  return `
    <div class="card-inner card-festival" id="exportable-card">
      <div class="fest-header">
        <div class="fest-top-badge">PRESENTS LIVE IN CONCERT</div>
        <h1 class="fest-title">AURA FEST</h1>
        <div class="fest-meta-bar">
          <span>${rangeLabel}</span>
          <span>•</span>
          <span>CURATED BY ${escapeHtml(user.display_name).toUpperCase()}</span>
          <span>•</span>
          <span>MAIN STAGE</span>
        </div>
      </div>

      <div class="fest-billing">
        <div class="billing-tier tier-headliner">
          <span class="act-name">${escapeHtml(headliner)}</span>
        </div>
        <div class="billing-tier tier-sub">
          <span class="act-name">${escapeHtml(subHeadliners)}</span>
        </div>
        <div class="billing-tier tier-support">
          <span class="act-name">${escapeHtml(supporting)}</span>
        </div>
        <div class="billing-tier tier-genres">
          <span>SPECIAL SETS: ${escapeHtml(data.stats.dominantGenre).toUpperCase()}</span>
        </div>
      </div>

      <div class="fest-setlist-box">
        <div class="fest-setlist-title">OFFICIAL FESTIVAL ANTHEMS (CLICK TO PLAY)</div>
        <div class="fest-tracks-grid">
          ${tracks.slice(0, 5).map((track, i) => {
            const active = isTrackActive(track.id, playbackState);
            return `
              <div class="fest-track-item track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}" title="Click to play preview">
                <span class="fest-track-idx">0${i + 1}</span>
                <span class="fest-track-name">${escapeHtml(track.name)}</span>
                <span class="fest-track-artist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
                ${getIndicator(track.id, playbackState)}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="fest-footer">
        <div class="fest-barcode-wrap">
          <div class="fest-barcode">||| | |||| | ||| |||| | | |||| |||</div>
          <div class="fest-serial">PASS ID: ${Math.floor(100000 + Math.random() * 900000)} // SPOTIFY CERTIFIED</div>
        </div>
        <div class="fest-stamp">VIP ACCESS</div>
      </div>
    </div>
  `;
}

/**
 * Render Sound DNA Aurora Glass Card
 */
export function renderDnaCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Explorer' };
  const tracks = data.topTracks || [];
  const stats = data.stats || {};
  const rangeLabel = getTimeRangeLabel(timeRange);

  return `
    <div class="card-inner card-dna" id="exportable-card">
      <div class="dna-aurora-bg"></div>
      
      <div class="dna-header">
        <div class="dna-user-chip">
          <img src="${(user.images && user.images[0]?.url) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" alt="Avatar" class="dna-avatar" />
          <div class="dna-user-text">
            <span class="dna-username">${escapeHtml(user.display_name)}</span>
            <span class="dna-subtitle">SONIC DNA • ${rangeLabel}</span>
          </div>
        </div>
        <div class="dna-vibe-pill">${escapeHtml(stats.vibeLabel || 'Euphoric Voyager')}</div>
      </div>

      <div class="dna-metrics-grid">
        <div class="dna-metric-card">
          <span class="metric-label">ENERGY LEVEL</span>
          <div class="metric-bar-wrap">
            <div class="metric-bar-fill" style="width: ${stats.energyScore}%"></div>
          </div>
          <span class="metric-val">${stats.energyScore}%</span>
        </div>
        <div class="dna-metric-card">
          <span class="metric-label">DANCEABILITY</span>
          <div class="metric-bar-wrap">
            <div class="metric-bar-fill" style="width: ${stats.danceScore}%"></div>
          </div>
          <span class="metric-val">${stats.danceScore}%</span>
        </div>
        <div class="dna-metric-card">
          <span class="metric-label">UNDERGROUND SCORE</span>
          <div class="metric-bar-wrap">
            <div class="metric-bar-fill" style="width: ${stats.obscurityScore}%"></div>
          </div>
          <span class="metric-val">${stats.obscurityScore}%</span>
        </div>
        <div class="dna-metric-card">
          <span class="metric-label">AVG TEMPO</span>
          <div class="metric-bar-wrap">
            <div class="metric-bar-fill" style="width: ${(stats.tempoBpm / 180) * 100}%"></div>
          </div>
          <span class="metric-val">${stats.tempoBpm} BPM</span>
        </div>
      </div>

      <div class="dna-genre-highlight">
        <span class="genre-tag">CORE FREQUENCY</span>
        <span class="genre-title">${escapeHtml(stats.dominantGenre)}</span>
      </div>

      <div class="dna-track-list">
        <div class="dna-tracks-heading">TOP ROTATION (CLICK TO LISTEN)</div>
        ${tracks.slice(0, 5).map((track, i) => {
          const active = isTrackActive(track.id, playbackState);
          const imgUrl = (track.album && track.album.images && track.album.images[0]?.url) || '';
          return `
            <div class="dna-track-row track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}">
              <span class="dna-idx">0${i + 1}</span>
              ${imgUrl ? `<img src="${imgUrl}" class="dna-album-art" alt="art" />` : ''}
              <div class="dna-track-info">
                <span class="dna-tname">${escapeHtml(track.name)}</span>
                <span class="dna-tartist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
              </div>
              <span class="dna-tdur">${formatDuration(track.duration_ms)}</span>
              ${getIndicator(track.id, playbackState)}
            </div>
          `;
        }).join('')}
      </div>

      <div class="dna-footer">
        <span>VIBEPRINT ALGORITHM v2.4</span>
        <span>SOUNDWRAPPED</span>
      </div>
    </div>
  `;
}

/**
 * Render Retro Mixtape / Cassette Card
 */
export function renderRetroCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Tape Head' };
  const tracks = data.topTracks || [];
  const rangeLabel = getTimeRangeLabel(timeRange);
  const isCurrentlyPlaying = playbackState && (
    (typeof playbackState === 'object' && playbackState.isPlaying) || 
    (typeof playbackState === 'string')
  );

  return `
    <div class="card-inner card-retro" id="exportable-card">
      <div class="cassette-body">
        <div class="cassette-screws top-screws"><span>+</span><span>+</span></div>
        
        <div class="cassette-label">
          <div class="label-header">
            <div class="side-badge">A</div>
            <div class="tape-title-handwritten">
              <span>MIXTAPE: ${escapeHtml(user.display_name).toUpperCase()}</span>
              <span class="tape-sub">${rangeLabel}</span>
            </div>
            <div class="tape-format">C-90 HIGH BIAS</div>
          </div>

          <div class="tape-window-area">
            <div class="spool spool-left ${isCurrentlyPlaying ? 'spinning' : ''}">
              <div class="teeth"></div>
            </div>
            <div class="tape-glass">
              <div class="tape-film"></div>
              <div class="tape-ruler">| • | • | • | • |</div>
            </div>
            <div class="spool spool-right ${isCurrentlyPlaying ? 'spinning' : ''}">
              <div class="teeth"></div>
            </div>
          </div>
        </div>

        <div class="cassette-screws bottom-screws"><span>+</span><span>+</span></div>
      </div>

      <div class="jcard-inlay">
        <div class="jcard-header">
          <span>TRACKLIST // SIDE A (CLICK TRACK)</span>
          <span class="jcard-genre">${escapeHtml(data.stats.dominantGenre)}</span>
        </div>
        <div class="jcard-tracks">
          ${tracks.slice(0, 5).map((track, i) => {
            const active = isTrackActive(track.id, playbackState);
            return `
              <div class="jcard-track-item track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}">
                <span class="j-num">${i + 1}.</span>
                <span class="j-title">${escapeHtml(track.name)}</span>
                <span class="j-artist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
                <span class="j-time">${formatDuration(track.duration_ms)}</span>
                ${getIndicator(track.id, playbackState)}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="cassette-meta-footer">
        <span>STEREO DOLBY B NR</span>
        <span>SOUNDWRAPPED ANALOG AUDIO</span>
      </div>
    </div>
  `;
}

/**
 * Render 8-Bit Arcade High-Score Card
 */
export function renderArcadeCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'PLAYER 1' };
  const tracks = data.topTracks || [];
  const rangeLabel = getTimeRangeLabel(timeRange);

  return `
    <div class="card-inner card-arcade" id="exportable-card">
      <div class="arcade-scanlines"></div>
      
      <div class="arcade-header">
        <div class="arcade-top-row">
          <span class="blink-text">1UP 00</span>
          <span>HIGH SCORE</span>
          <span>STAGE: ${rangeLabel}</span>
        </div>
        <h1 class="arcade-title">BEAT QUEST</h1>
        <div class="arcade-player-tag">PLAYER: ${escapeHtml(user.display_name).toUpperCase()}</div>
      </div>

      <div class="arcade-board">
        <div class="board-header">
          <span>RANK</span>
          <span>TRACK / ARTIST</span>
          <span>SCORE</span>
        </div>
        <div class="board-rows">
          ${tracks.slice(0, 5).map((track, i) => {
            const active = isTrackActive(track.id, playbackState);
            const points = (99000 - (i * 12340)).toLocaleString();
            return `
              <div class="arcade-row track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}">
                <span class="a-rank">${i + 1}ST</span>
                <div class="a-info">
                  <span class="a-song">${escapeHtml(track.name)}</span>
                  <span class="a-artist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
                </div>
                <span class="a-score">${points}</span>
                ${getIndicator(track.id, playbackState)}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="arcade-stats-bar">
        <div class="astat">
          <span>VIBE CLASS:</span>
          <strong>${escapeHtml(data.stats.vibeLabel)}</strong>
        </div>
        <div class="astat">
          <span>BPM SPEED:</span>
          <strong>${data.stats.tempoBpm}</strong>
        </div>
      </div>

      <div class="arcade-footer">
        <span>INSERT COIN TO CONTINUE</span>
        <span class="arcade-cred">CREDITS 99</span>
      </div>
    </div>
  `;
}

/**
 * Render Thermal Receipt 2.0 Card
 */
export function renderReceiptCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Customer' };
  const tracks = data.topTracks || [];
  const rangeLabel = getTimeRangeLabel(timeRange);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let totalMs = 0;
  tracks.slice(0, 5).forEach(t => totalMs += (t.duration_ms || 0));

  return `
    <div class="card-inner card-receipt" id="exportable-card">
      <div class="receipt-tear top-tear"></div>

      <div class="receipt-header">
        <h2 class="receipt-brand">VIBE CAFE & RECORDS</h2>
        <div class="receipt-meta">
          <div>ORDER #00${Math.floor(100 + Math.random() * 900)} // SPOTIFY TERMINAL</div>
          <div>FOR: ${escapeHtml(user.display_name).toUpperCase()}</div>
          <div>DATE: ${dateStr} ${timeStr}</div>
          <div>TIMEFRAME: ${rangeLabel}</div>
        </div>
      </div>

      <div class="receipt-divider">-----------------------------------------</div>

      <div class="receipt-items">
        <div class="receipt-item-head">
          <span class="qty">QTY</span>
          <span class="desc">ITEM / ARTIST</span>
          <span class="amt">AMT</span>
        </div>
        ${tracks.slice(0, 5).map((track, i) => {
          const active = isTrackActive(track.id, playbackState);
          const durStr = formatDuration(track.duration_ms);
          return `
            <div class="receipt-row track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}">
              <span class="qty">0${i + 1}</span>
              <div class="desc">
                <span class="r-track">${escapeHtml(track.name)}</span>
                <span class="r-artist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
              </div>
              <span class="amt">${durStr}</span>
              ${getIndicator(track.id, playbackState)}
            </div>
          `;
        }).join('')}
      </div>

      <div class="receipt-divider">-----------------------------------------</div>

      <div class="receipt-calc">
        <div class="calc-row">
          <span>ITEM COUNT:</span>
          <span>5 TRACKS</span>
        </div>
        <div class="calc-row">
          <span>TOTAL RUNTIME:</span>
          <span>${formatDuration(totalMs)}</span>
        </div>
        <div class="calc-row">
          <span>GENRE TAX (${escapeHtml(data.stats.dominantGenre)}):</span>
          <span>$0.00</span>
        </div>
        <div class="calc-row total-bold">
          <span>VIBE TOTAL:</span>
          <span>100% PURE SOUL</span>
        </div>
      </div>

      <div class="receipt-divider">-----------------------------------------</div>

      <div class="receipt-barcode-wrap">
        <div class="r-barcode">||| |||| || | ||||| ||| || |||| || |||</div>
        <div class="r-cardnum">CARD: **** **** **** 2026</div>
        <div class="r-thankyou">THANK YOU FOR SUPPORTING MUSIC!</div>
        <div class="r-website">SOUNDWRAPPED.APP</div>
      </div>

      <div class="receipt-tear bottom-tear"></div>
    </div>
  `;
}
