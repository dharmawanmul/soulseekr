/**
 * Soulseekr Card Rendering Engine
 * Renders 5 physical, museum-grade music artifacts:
 * 1. The Vinyl Master Sleeve (Japanese Obi-Strip + Peeking Disc)
 * 2. The Swiss Typographic Poster (International Typographic Style)
 * 3. The Spatial Sound Prism (VisionOS Refraction Glass & Vibe Matrix)
 * 4. Teenage Engineering Industrial Cassette (Tactile Mechanical Tape)
 * 5. Tokyo Archival Thermal Receipt (Record Bar Itemized Slip)
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

export function getTrackArtistNames(track) {
  if (!track) return 'Unknown Artist';
  if (Array.isArray(track.artists) && track.artists.length) {
    return track.artists
      .map(a => (a && typeof a === 'object' ? a.name : a) || '')
      .filter(Boolean)
      .join(', ') || 'Unknown Artist';
  }
  if (track.artistName) return track.artistName;
  return 'Unknown Artist';
}

export function getTimeRangeLabel(timeRange) {
  switch (timeRange) {
    case 'short_term': return 'PAST 4 WEEKS';
    case 'medium_term': return 'LAST 6 MONTHS';
    case 'long_term': return 'ALL-TIME ROTATION';
    case 'custom': return 'CURATED SELECTION';
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
    return '<span class="mini-spinner" title="Buffering audio preview..."></span>';
  }

  return '<span class="mini-eq"><span class="bar"></span><span class="bar"></span><span class="bar"></span></span>';
}

function isTrackActive(trackId, playbackState) {
  if (!playbackState) return false;
  if (typeof playbackState === 'string') return playbackState === trackId;
  return playbackState.trackId === trackId;
}

/**
 * 0. GATEWAY CARD (First-time user welcome & authorization prompt)
 */
export function renderGatewayCard() {
  return `
    <div class="card-inner card-gateway" id="exportable-card">
      <div class="gateway-icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fafafa">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.218.358-.68.472-1.038.254-2.846-1.74-6.428-2.134-10.648-1.168-.41.094-.823-.162-.917-.573-.095-.41.162-.823.573-.918 4.623-1.056 8.577-.614 11.776 1.367.358.218.472.68.254 1.038zm1.47-3.267c-.276.449-.864.593-1.313.317-3.259-2.003-8.228-2.583-12.083-1.413-.505.153-1.039-.136-1.192-.641-.153-.505.137-1.039.642-1.192 4.41-1.338 9.888-.686 13.626 1.616.449.276.593.864.32 1.313zm.126-3.41c-3.908-2.321-10.354-2.535-14.075-1.405-.599.182-1.233-.161-1.415-.76-.182-.599.161-1.233.76-1.415 4.277-1.298 11.393-1.047 15.864 1.607.538.319.715 1.015.396 1.553-.319.538-1.015.715-1.53.397z"/>
        </svg>
      </div>

      <div class="gateway-badge">ARCHIVAL SOUND EXHIBIT</div>

      <h2 class="gateway-title">Connect Spotify<br>to reveal your artifacts</h2>
      
      <p class="gateway-desc">
        Connect Spotify to turn your listening history into Japanese Obi sleeves, Swiss posters, and playable cassettes.
      </p>

      <div class="gateway-actions-row">
        <button id="btn-gateway-auth" class="btn btn-spotify btn-gateway-action">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.218.358-.68.472-1.038.254-2.846-1.74-6.428-2.134-10.648-1.168-.41.094-.823-.162-.917-.573-.095-.41.162-.823.573-.918 4.623-1.056 8.577-.614 11.776 1.367.358.218.472.68.254 1.038zm1.47-3.267c-.276.449-.864.593-1.313.317-3.259-2.003-8.228-2.583-12.083-1.413-.505.153-1.039-.136-1.192-.641-.153-.505.137-1.039.642-1.192 4.41-1.338 9.888-.686 13.626 1.616.449.276.593.864.32 1.313zm.126-3.41c-3.908-2.321-10.354-2.535-14.075-1.405-.599.182-1.233-.161-1.415-.76-.182-.599.161-1.233.76-1.415 4.277-1.298 11.393-1.047 15.864 1.607.538.319.715 1.015.396 1.553-.319.538-1.015.715-1.53.397z"/>
          </svg>
          Authorize with Spotify
        </button>
      </div>

      <div class="gateway-archetypes-preview">
        <span class="preview-pill">Vinyl Obi</span>
        <span class="preview-pill">Swiss Poster</span>
        <span class="preview-pill">Sound Prism</span>
        <span class="preview-pill">Cassette</span>
        <span class="preview-pill">Thermal Slip</span>
        <span class="preview-pill">90s Cartridge</span>
        <span class="preview-pill">VIP Pass</span>
      </div>

      <div class="gateway-footer-note">
        Client-side PKCE OAuth. Runs entirely in your browser.
      </div>
    </div>
  `;
}

/**
 * 1. THE VINYL MASTER SLEEVE (Japanese Obi-Strip + Peeking Disc)
 */
export function renderVinylCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Audiophile' };
  const tracks = data.topTracks || [];
  const rangeLabel = getTimeRangeLabel(timeRange);
  const dominantGenre = data.stats?.dominantGenre || 'Electronic / Modern';

  return `
    <div class="card-inner card-vinyl" id="exportable-card">
      <div class="vinyl-obi">
        <div class="obi-top">
          <span class="obi-badge">限定盤</span>
          <span class="obi-kanji-vert">最高峰の音楽体験</span>
        </div>
        <div class="obi-cat-num">SLSK-2026-JP // STEREO</div>
      </div>

      <div class="vinyl-sleeve-main">
        <div class="vinyl-disc-peeking"></div>

        <div class="vinyl-header">
          <div class="vinyl-meta-tag">
            <span>MASTER RECORDING // SIDE A</span>
            <span>${rangeLabel}</span>
          </div>
          <h2 class="vinyl-album-title">${escapeHtml(user?.display_name || user?.id || 'Audiophile').toUpperCase()}</h2>
          <div class="vinyl-curator">${escapeHtml(dominantGenre).toUpperCase()} ARCHIVE</div>
        </div>

        <div class="vinyl-tracklist">
          ${tracks.slice(0, 5).map((track, i) => {
            const active = isTrackActive(track.id, playbackState);
            return `
              <div class="vinyl-track-row track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}" title="Play audio preview">
                <span class="v-idx">A-0${i + 1}</span>
                <div class="v-info">
                  <span class="v-title">${escapeHtml(track.name)}</span>
                  <span class="v-artist">${escapeHtml(getTrackArtistNames(track))}</span>
                </div>
                <span class="v-dur">${formatDuration(track.duration_ms)}</span>
                ${getIndicator(track.id, playbackState)}
              </div>
            `;
          }).join('')}
        </div>

        <div class="vinyl-footer">
          <div class="hologram-seal">SOULSEEKR EDITION</div>
          <div class="vinyl-rpm">33⅓ RPM • LISTENING ARCHIVE</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 2. SWISS TYPOGRAPHIC FESTIVAL POSTER (Josef Müller-Brockmann inspired)
 */
export function renderSwissCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Curator' };
  const artists = data.topArtists || [];
  const tracks = data.topTracks || [];
  const rangeLabel = getTimeRangeLabel(timeRange);

  const headliner = artists[0] ? artists[0].name.toUpperCase() : (tracks[0]?.artists[0]?.name?.toUpperCase() || 'THE WEEKND');
  const subs = artists.slice(1, 3).map(a => a.name.toUpperCase()).join(' / ') || 'DAFT PUNK / M83';
  const support = artists.slice(3, 5).map(a => a.name.toUpperCase()).join(' • ') || 'DUA LIPA • ARCTIC MONKEYS';

  return `
    <div class="card-inner card-swiss" id="exportable-card">
      <div class="swiss-grid-marks">
        <span>SWISS FESTIVAL ARCHIVE</span>
        <span>GRID: 12/24</span>
        <span>${rangeLabel}</span>
      </div>

      <div class="swiss-title-block">
        <h1 class="swiss-super-title">SOULSEEKR 26</h1>
        <div class="swiss-meta-coords">
          <span>CURATOR: ${escapeHtml(user?.display_name || user?.id || 'Curator').toUpperCase()}</span>
          <span>VENUE: MAIN STAGE // HEADPHONES</span>
        </div>
      </div>

      <div class="swiss-billing-hierarchy">
        <div class="swiss-headliner">${escapeHtml(headliner)}</div>
        <div class="swiss-subs">${escapeHtml(subs)}</div>
        <div class="swiss-support">${escapeHtml(support)}</div>
      </div>

      <div class="swiss-setlist-section">
        <div class="swiss-section-header">OFFICIAL SETLIST (CLICK TO PLAY)</div>
        <div class="swiss-tracks-list">
          ${tracks.slice(0, 5).map((track, i) => {
            const active = isTrackActive(track.id, playbackState);
            return `
              <div class="swiss-track-item track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}">
                <span class="s-num">0${i + 1}</span>
                <div class="s-text">
                  <span class="s-name">${escapeHtml(track.name)}</span>
                  <span class="s-sub">${escapeHtml(getTrackArtistNames(track))}</span>
                </div>
                <span class="s-dur">${formatDuration(track.duration_ms)}</span>
                ${getIndicator(track.id, playbackState)}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="swiss-footer">
        <div class="swiss-barcode">|| | |||| | ||| |||| | | |||</div>
        <div class="swiss-badge">ALL ACCESS VIP</div>
      </div>
    </div>
  `;
}

/**
 * 3. SPATIAL SOUND PRISM (VisionOS Refraction Glass & Vibe Matrix)
 */
export function renderPrismCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Explorer' };
  const tracks = data.topTracks || [];
  const stats = data.stats || {};
  const rangeLabel = getTimeRangeLabel(timeRange);
  const profileUrl = user.images?.[0]?.url || '';
  const profileInitial = (user.display_name || user.id || 'S').trim().charAt(0).toUpperCase();

  return `
    <div class="card-inner card-prism" id="exportable-card">
      <div class="prism-header">
        <div class="prism-user-badge">
          ${profileUrl
            ? `<img src="${escapeHtml(profileUrl)}" alt="Spotify profile" class="prism-avatar">`
            : `<span class="prism-avatar artwork-placeholder" aria-hidden="true">${escapeHtml(profileInitial)}</span>`}
          <div class="prism-user-text">
            <span class="prism-name">${escapeHtml(user?.display_name || user?.id || 'Explorer')}</span>
            <span class="prism-subtitle">SOUND MATRIX • ${rangeLabel}</span>
          </div>
        </div>
        <div class="prism-frequency-pill">${escapeHtml(stats.vibeLabel || 'Euphoric')}</div>
      </div>

      <div class="prism-metrics-quad">
        <div class="prism-metric-card">
          <span class="p-label">ENERGY LEVEL</span>
          <div class="p-bar-track">
            <div class="p-bar-val" style="width: ${stats.energyScore}%"></div>
          </div>
          <span class="p-val-text">${stats.energyScore}%</span>
        </div>
        <div class="prism-metric-card">
          <span class="p-label">DANCEABILITY</span>
          <div class="p-bar-track">
            <div class="p-bar-val" style="width: ${stats.danceScore}%"></div>
          </div>
          <span class="p-val-text">${stats.danceScore}%</span>
        </div>
        <div class="prism-metric-card">
          <span class="p-label">UNDERGROUND SCORE</span>
          <div class="p-bar-track">
            <div class="p-bar-val" style="width: ${stats.obscurityScore}%"></div>
          </div>
          <span class="p-val-text">${stats.obscurityScore}%</span>
        </div>
        <div class="prism-metric-card">
          <span class="p-label">PULSE TEMPO</span>
          <div class="p-bar-track">
            <div class="p-bar-val" style="width: ${(stats.tempoBpm / 180) * 100}%"></div>
          </div>
          <span class="p-val-text">${stats.tempoBpm} BPM</span>
        </div>
      </div>

      <div class="prism-tracks-container">
        ${tracks.slice(0, 5).map((track, i) => {
          const active = isTrackActive(track.id, playbackState);
          const imgUrl = (track.album && track.album.images && track.album.images[0]?.url) || '';
          return `
            <div class="prism-track-row track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}">
              ${imgUrl ? `<img src="${imgUrl}" class="prism-art-thumb" alt="art" />` : ''}
              <div class="prism-track-meta">
                <span class="prism-tname">${escapeHtml(track.name)}</span>
                <span class="prism-tartist">${escapeHtml(getTrackArtistNames(track))}</span>
              </div>
              <span class="prism-tdur" style="font-family:var(--font-mono); font-size:0.65rem; color:#a1a1aa;">${formatDuration(track.duration_ms)}</span>
              ${getIndicator(track.id, playbackState)}
            </div>
          `;
        }).join('')}
      </div>

      <div class="prism-footer">
        <span>PRIMARY FREQ: ${escapeHtml(stats.dominantGenre).toUpperCase()}</span>
        <span>SOULSEEKR OS</span>
      </div>
    </div>
  `;
}

/**
 * 4. TEENAGE ENGINEERING INDUSTRIAL CASSETTE (Tactile Hardware)
 */
export function renderCassetteCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Tape Head' };
  const tracks = data.topTracks || [];
  const rangeLabel = getTimeRangeLabel(timeRange);
  const isPlaying = playbackState && (
    (typeof playbackState === 'object' && playbackState.isPlaying) ||
    (typeof playbackState === 'string')
  );

  return `
    <div class="card-inner card-cassette" id="exportable-card">
      <div class="cassette-shell">
        <div class="screw-row"><span>+</span><span>+</span></div>

        <div class="cassette-label-sticker">
          <div class="label-top-row">
            <span class="tape-side-chip">A</span>
            <div class="tape-curator-title">
              <span>MIXTAPE: ${escapeHtml(user?.display_name || user?.id || 'Tape Head').toUpperCase()}</span>
              <span style="font-size:0.6rem; color:#62626b;">${rangeLabel}</span>
            </div>
            <span style="font-size:0.6rem; font-weight:700;">TYPE-II</span>
          </div>

          <div class="spool-window">
            <div class="spool-gear ${isPlaying ? 'spinning' : ''}"></div>
            <div class="tape-tape-ribbon">
              <div class="ribbon-fill"></div>
            </div>
            <div class="spool-gear ${isPlaying ? 'spinning' : ''}"></div>
          </div>
        </div>

        <div class="screw-row"><span>+</span><span>+</span></div>
      </div>

      <div class="cassette-jcard">
        <div class="jcard-top">
          <span>TRACKLIST // SIDE A</span>
          <span>${escapeHtml(data.stats?.dominantGenre || 'STEREO')}</span>
        </div>
        <div class="jcard-list">
          ${tracks.slice(0, 5).map((track, i) => {
            const active = isTrackActive(track.id, playbackState);
            return `
              <div class="jcard-item track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}">
                <span class="j-num">0${i + 1}.</span>
                <span class="j-title">${escapeHtml(track.name)}</span>
                <span class="j-artist">${escapeHtml(getTrackArtistNames(track))}</span>
                <span class="j-time">${formatDuration(track.duration_ms)}</span>
                ${getIndicator(track.id, playbackState)}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * 5. TOKYO ARCHIVAL THERMAL RECEIPT (Shibuya Record Bar Slip)
 */
export function renderReceiptCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Customer' };
  const tracks = data.topTracks || [];
  const rangeLabel = getTimeRangeLabel(timeRange);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Derive a stable slip number from the user's display_name so it doesn't
  // re-roll every time the card re-renders due to playback state changes.
  const slipSeed = (user.display_name || 'Customer').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const slipNumber = String(100 + (slipSeed % 900)).padStart(3, '0');

  let totalMs = 0;
  tracks.slice(0, 5).forEach(t => totalMs += (t.duration_ms || 0));

  return `
    <div class="card-inner card-receipt" id="exportable-card">
      <div class="receipt-tear top-tear"></div>

      <div class="receipt-head">
        <h2 class="receipt-logo">RECORD BAR ARCHIVE</h2>
        <div class="receipt-sub">
          <div>SLIP #${slipNumber} // SPOTIFY TERMINAL</div>
          <div>CUSTOMER: ${escapeHtml(user.display_name).toUpperCase()}</div>
          <div>TIMESTAMP: ${dateStr} ${timeStr}</div>
          <div>TIMEFRAME: ${rangeLabel}</div>
        </div>
      </div>

      <div class="r-rule">----------------------------------------</div>

      <div class="receipt-table-head">
        <span class="r-col-qty">QTY</span>
        <span class="r-col-desc">ITEM // ARTIST</span>
        <span class="r-col-amt">DUR</span>
      </div>

      <div class="receipt-rows">
        ${tracks.slice(0, 5).map((track, i) => {
          const active = isTrackActive(track.id, playbackState);
          return `
            <div class="receipt-line track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}">
              <span class="r-col-qty">0${i + 1}</span>
              <div class="r-col-desc">
                <span class="r-track-t">${escapeHtml(track.name)}</span>
                <span class="r-artist-t">${escapeHtml(getTrackArtistNames(track))}</span>
              </div>
              <span class="r-col-amt">${formatDuration(track.duration_ms)}</span>
              ${getIndicator(track.id, playbackState)}
            </div>
          `;
        }).join('')}
      </div>

      <div class="r-rule">----------------------------------------</div>

      <div class="receipt-totals">
        <div class="r-total-line">
          <span>ITEM COUNT:</span>
          <span>5 SELECTIONS</span>
        </div>
        <div class="r-total-line">
          <span>TOTAL RUNTIME:</span>
          <span>${formatDuration(totalMs)}</span>
        </div>
        <div class="r-total-line">
          <span>GENRE TAX (${escapeHtml(data.stats?.dominantGenre || 'MUSIC')}):</span>
          <span>$0.00</span>
        </div>
        <div class="r-total-line r-total-grand">
          <span>TOTAL VIBE:</span>
          <span>100% PURE SOUL</span>
        </div>
      </div>

      <div class="r-rule">----------------------------------------</div>

      <div class="receipt-barcode-box">
        <div class="r-barcode-visual">||| |||| || | ||||| ||| || |||| ||</div>
        <div class="r-barcode-note">GENERATED LOCALLY IN YOUR BROWSER</div>
        <div class="r-barcode-note" style="font-weight:700; margin-top:2px;">SOULSEEKR.APP</div>
      </div>

      <div class="receipt-tear bottom-tear"></div>
    </div>
  `;
}

/**
 * 6. THE TITANIUM STUDIO DAP
 */
export function renderDapCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'Audiophile Master' };
  const tracks = data.topTracks || [];
  const stats = data.stats || {};
  const rangeLabel = getTimeRangeLabel(timeRange);
  const topSong = tracks[0] || { name: 'No track available', artists: [] };
  const topCover = topSong.album?.images?.[0]?.url || '';
  const hasObscurityScore = Number.isFinite(stats.obscurityScore);
  const obscurityScore = hasObscurityScore ? Math.max(0, Math.min(100, stats.obscurityScore)) : 0;
  const obscurityLabel = hasObscurityScore ? `${Math.round(obscurityScore)}%` : 'N/A';
  const tempoLabel = Number.isFinite(stats.tempoBpm) ? `${Math.round(stats.tempoBpm)} BPM` : 'TEMPO NOT AVAILABLE';

  return `
    <div class="card-inner card-dap" id="exportable-card">
      <div class="dap-chassis-top">
        <div class="dap-jack-group">
          <div class="dap-jack-rim" title="Archive player detail">
            <div class="dap-jack-bore"></div>
          </div>
          <span class="dap-jack-label">ARCHIVE</span>
        </div>
        <div class="dap-chassis-brand">
          <span class="dap-brand-name">SOULSEEKR</span>
          <span class="dap-brand-model">STUDIO PLAYER // TITANIUM</span>
        </div>
        <div class="dap-volume-crown" title="Precision Knurled Volume Crown"></div>
      </div>

      <!-- OLED Display Screen Bevel -->
      <div class="dap-screen-bezel">
        <div class="dap-screen-oled">
          <!-- Status Bar -->
          <div class="dap-status-bar">
            <span class="dap-status-mode">LISTENING ARCHIVE</span>
            <div class="dap-status-center">
              <span class="dap-hi-res-badge">TOP TRACK</span>
            </div>
            <div class="dap-battery-stat">
              <span class="dap-volt-val">SLSK</span>
              <div class="dap-battery-icon"><div class="dap-battery-cell"></div></div>
            </div>
          </div>

          <!-- Hero Playing Track Meta -->
          <div class="dap-hero-track">
            ${topCover
              ? `<img src="${escapeHtml(topCover)}" class="dap-album-art" alt="Album cover">`
              : '<span class="dap-album-art artwork-placeholder">No artwork</span>'}
            <div class="dap-track-meta">
              <span class="dap-track-rank">TOP FREQUENCY • ${rangeLabel.toUpperCase()}</span>
              <h3 class="dap-track-title">${escapeHtml(topSong.name)}</h3>
              <p class="dap-track-artist">${escapeHtml(getTrackArtistNames(topSong))}</p>
              <div class="dap-audio-specs">
                <span>SPOTIFY CATALOG METADATA</span>
                <span>•</span>
                <span>${tempoLabel}</span>
              </div>
            </div>
          </div>

          <!-- Stereo VU Peak Level Meters -->
          <div class="dap-vu-meters">
            <div class="dap-vu-channel">
              <span class="dap-vu-tag">L</span>
              <div class="dap-vu-bar"><div class="dap-vu-level dap-vu-l"></div></div>
              <span class="dap-vu-db">CHANNEL A</span>
            </div>
            <div class="dap-vu-channel">
              <span class="dap-vu-tag">R</span>
              <div class="dap-vu-bar"><div class="dap-vu-level dap-vu-r"></div></div>
              <span class="dap-vu-db">CHANNEL B</span>
            </div>
          </div>

          <!-- Top Tracks Playlist -->
          <div class="dap-track-list">
            <div class="dap-list-header">
              <span>TOP PLAYLIST (TAP TO PREVIEW)</span>
              <span>TIME</span>
            </div>
            ${tracks.slice(0, 5).map((track, i) => {
              const active = isTrackActive(track.id, playbackState);
              return `
                <div class="dap-track-row track-play-trigger ${active ? 'active' : ''}" data-track-id="${track.id}">
                  <div class="dap-row-left">
                    <span class="dap-row-num">0${i + 1}</span>
                    <span class="dap-row-name">${escapeHtml(track.name)}</span>
                  </div>
                  <div class="dap-row-right">
                    ${active ? '<span class="dap-playing-pulse">▶ PLAYING</span>' : `<span class="dap-row-time">${formatDuration(track.duration_ms)}</span>`}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Audiophile Obscurity & Aura Chassis Footer -->
      <div class="dap-chassis-footer">
        <div class="snob-meter-container" style="margin-top:0.35rem;">
          <div class="snob-meter-header">
            <span>OBSCURITY SNOB RATING</span>
            <span class="snob-score-tag">${obscurityLabel} • ${escapeHtml(stats.obscurityTier || 'Not available')}</span>
          </div>
          <div class="snob-meter-track">
            <div class="snob-meter-fill" style="width: ${obscurityScore}%"></div>
          </div>
        </div>

        <div class="dap-footer-meta">
          <div class="snob-aura-pill">
            <span class="snob-aura-dot" style="background:${stats.auraColors?.[1] || '#c084fc'};"></span>
            <span>AURA: ${escapeHtml(stats.auraTitle || 'Not available').toUpperCase()}</span>
          </div>
          <span class="dap-certification">SOULSEEKR EDITION • LISTENING ARCHIVE</span>
        </div>
      </div>
    </div>
  `;
}

// Preserve the previous renderer import name.
export const renderGameboyCard = renderDapCard;

/**
 * 7. THE ALL-ACCESS VIP FESTIVAL PASS (Holographic Band & Security RFID)
 */
export function renderVipPassCard(data, timeRange, playbackState) {
  const user = data.user || { display_name: 'VIP Guest' };
  const tracks = data.topTracks || [];
  const stats = data.stats || {};
  const rangeLabel = getTimeRangeLabel(timeRange);
  const avatarUrl = user.images?.[0]?.url || '';
  const avatarInitial = (user.display_name || user.id || 'S').trim().charAt(0).toUpperCase();
  const hasObscurityScore = Number.isFinite(stats.obscurityScore);
  const obscurityScore = hasObscurityScore ? Math.max(0, Math.min(100, stats.obscurityScore)) : 0;
  const obscurityLabel = hasObscurityScore ? `${Math.round(obscurityScore)}%` : 'N/A';

  const stages = ["MAIN STAGE", "HYPER TENT", "THE VELVET DOME", "OBSCURITY LAB", "AFTERHOURS"];
  const setTimes = ["20:00", "21:15", "22:30", "23:45", "01:00"];

  return `
    <div class="card-inner card-vippass" id="exportable-card">
      <div class="lanyard-slot-row">
        <div class="lanyard-slot"></div>
      </div>

      <div class="vip-hologram-band"></div>

      <div class="vip-badge-row">
        <div class="vip-event-meta">SOULSEEKR 2026 // ${rangeLabel}</div>
        <div class="vip-all-access-tag">IMAGINED FESTIVAL EDITION</div>
      </div>

      <div class="vip-holder-box">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div class="vip-holder-label">CREDENTIAL ISSUED TO:</div>
            <div class="vip-holder-name">${escapeHtml(user?.display_name || user?.id || 'VIP Guest').toUpperCase()}</div>
          </div>
          ${avatarUrl
            ? `<img src="${escapeHtml(avatarUrl)}" alt="Spotify profile" class="vip-profile-image">`
            : `<span class="vip-profile-image artwork-placeholder" aria-hidden="true">${escapeHtml(avatarInitial)}</span>`}
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; align-items: center;">
          <div class="snob-aura-pill">
            <span class="snob-aura-dot" style="background:${stats.auraColors?.[1] || '#38bdf8'};"></span>
            <span>AURA: ${escapeHtml(stats.auraTitle || 'Sonic Nebula')}</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 0.55rem; color: #ed6a45; margin-left: auto;">SAMPLE CREDENTIAL</span>
        </div>
      </div>

      <div class="vip-timetable">
        <div style="font-family: var(--font-mono); font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; color: #a1a1aa; margin-bottom: 0.2rem;">
          HEADLINER SETLIST &amp; TIMETABLE (TAP TO PREVIEW)
        </div>
        ${tracks.slice(0, 5).map((track, i) => {
          const active = isTrackActive(track.id, playbackState);
          return `
            <div class="vip-set-row track-play-trigger ${active ? 'active' : ''}" data-track-id="${track.id}">
              <span class="vip-set-time">${setTimes[i] || '20:00'}</span>
              <div class="vip-set-info">
                <div class="vip-set-song">${escapeHtml(track.name)}</div>
                <div class="vip-set-artist">${escapeHtml(getTrackArtistNames(track))} • ${stages[i]}</div>
              </div>
              ${getIndicator(track.id, playbackState)}
            </div>
          `;
        }).join('')}
      </div>

      <div class="snob-meter-container">
        <div class="snob-meter-header">
          <span>OBSCURITY SNOB INDEX</span>
          <span class="snob-score-tag">${obscurityLabel} • ${escapeHtml(stats.obscurityTier || 'Not available')}</span>
        </div>
        <div class="snob-meter-track">
          <div class="snob-meter-fill" style="width: ${obscurityScore}%"></div>
        </div>
      </div>

      <div class="vip-footer-row" style="margin-top: 0.85rem;">
        <span class="vip-barcode-code">||| | ||||| || ||| |||| || |</span>
        <span style="font-family: var(--font-mono); font-size: 0.55rem; color: #a1a1aa;">SOULSEEKR FESTIVAL STUDY</span>
      </div>
    </div>
  `;
}
