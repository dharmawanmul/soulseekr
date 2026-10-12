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
    return '<span class="mini-spinner" title="Buffering studio audio..."></span>';
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
      <div class="gateway-halo"></div>
      <div class="gateway-icon-wrap">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="#10b981">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.218.358-.68.472-1.038.254-2.846-1.74-6.428-2.134-10.648-1.168-.41.094-.823-.162-.917-.573-.095-.41.162-.823.573-.918 4.623-1.056 8.577-.614 11.776 1.367.358.218.472.68.254 1.038zm1.47-3.267c-.276.449-.864.593-1.313.317-3.259-2.003-8.228-2.583-12.083-1.413-.505.153-1.039-.136-1.192-.641-.153-.505.137-1.039.642-1.192 4.41-1.338 9.888-.686 13.626 1.616.449.276.593.864.32 1.313zm.126-3.41c-3.908-2.321-10.354-2.535-14.075-1.405-.599.182-1.233-.161-1.415-.76-.182-.599.161-1.233.76-1.415 4.277-1.298 11.393-1.047 15.864 1.607.538.319.715 1.015.396 1.553-.319.538-1.015.715-1.53.397z"/>
        </svg>
      </div>

      <div class="gateway-badge">ARCHIVAL SOUND EXHIBIT</div>

      <h2 class="gateway-title">CONNECT SPOTIFY TO REVEAL YOUR ARTIFACTS</h2>
      
      <p class="gateway-desc">
        Authorize your Spotify account to analyze your listening history and generate tactile physical artifacts — Japanese Obi sleeves, Swiss posters, and playable cassettes.
      </p>

      <div class="gateway-actions-row">
        <button id="btn-gateway-auth" class="btn btn-spotify btn-gateway-action">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.218.358-.68.472-1.038.254-2.846-1.74-6.428-2.134-10.648-1.168-.41.094-.823-.162-.917-.573-.095-.41.162-.823.573-.918 4.623-1.056 8.577-.614 11.776 1.367.358.218.472.68.254 1.038zm1.47-3.267c-.276.449-.864.593-1.313.317-3.259-2.003-8.228-2.583-12.083-1.413-.505.153-1.039-.136-1.192-.641-.153-.505.137-1.039.642-1.192 4.41-1.338 9.888-.686 13.626 1.616.449.276.593.864.32 1.313zm.126-3.41c-3.908-2.321-10.354-2.535-14.075-1.405-.599.182-1.233-.161-1.415-.76-.182-.599.161-1.233.76-1.415 4.277-1.298 11.393-1.047 15.864 1.607.538.319.715 1.015.396 1.553-.319.538-1.015.715-1.53.397z"/>
          </svg>
          Authorize with Spotify
        </button>
        <button id="btn-gateway-custom" class="btn btn-secondary btn-gateway-secondary">
          Craft Custom Mix
        </button>
      </div>

      <div class="gateway-archetypes-preview">
        <span class="preview-pill">💿 Vinyl Obi</span>
        <span class="preview-pill">📐 Swiss Grid</span>
        <span class="preview-pill">🔮 Sound Prism</span>
        <span class="preview-pill">📼 Cassette</span>
        <span class="preview-pill">🧾 Thermal Slip</span>
      </div>

      <div class="gateway-footer-note">
        🔒 100% Client-Side PKCE OAuth • Direct from your browser
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
        <div class="obi-cat-num">SW-2026-JP // STEREO</div>
      </div>

      <div class="vinyl-sleeve-main">
        <div class="vinyl-disc-peeking"></div>

        <div class="vinyl-header">
          <div class="vinyl-meta-tag">
            <span>MASTER RECORDING // SIDE A</span>
            <span>${rangeLabel}</span>
          </div>
          <h2 class="vinyl-album-title">${escapeHtml(user.display_name).toUpperCase()}</h2>
          <div class="vinyl-curator">${escapeHtml(dominantGenre).toUpperCase()} ARCHIVE</div>
        </div>

        <div class="vinyl-tracklist">
          ${tracks.slice(0, 5).map((track, i) => {
            const active = isTrackActive(track.id, playbackState);
            return `
              <div class="vinyl-track-row track-play-trigger ${active ? 'playing' : ''}" data-track-id="${track.id}" title="Click to stream 30s studio audio">
                <span class="v-idx">A-0${i + 1}</span>
                <div class="v-info">
                  <span class="v-title">${escapeHtml(track.name)}</span>
                  <span class="v-artist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
                </div>
                <span class="v-dur">${formatDuration(track.duration_ms)}</span>
                ${getIndicator(track.id, playbackState)}
              </div>
            `;
          }).join('')}
        </div>

        <div class="vinyl-footer">
          <div class="hologram-seal">HIFI CERTIFIED</div>
          <div class="vinyl-rpm">33⅓ RPM • DIRECT METAL MASTERING</div>
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
  const subs = artists.slice(1, 3).map(a => a.name.toUpperCase()).join(' — ') || 'DAFT PUNK — M83';
  const support = artists.slice(3, 5).map(a => a.name.toUpperCase()).join(' • ') || 'DUA LIPA • ARCTIC MONKEYS';

  return `
    <div class="card-inner card-swiss" id="exportable-card">
      <div class="swiss-grid-marks">
        <span>SWISS FESTIVAL ARCHIVE</span>
        <span>GRID: 12/24</span>
        <span>${rangeLabel}</span>
      </div>

      <div class="swiss-title-block">
        <h1 class="swiss-super-title">SONIC 26</h1>
        <div class="swiss-meta-coords">
          <span>CURATOR: ${escapeHtml(user.display_name).toUpperCase()}</span>
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
                  <span class="s-sub">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
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

  return `
    <div class="card-inner card-prism" id="exportable-card">
      <div class="prism-header">
        <div class="prism-user-badge">
          <img src="${(user.images && user.images[0]?.url) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" alt="Avatar" class="prism-avatar" />
          <div class="prism-user-text">
            <span class="prism-name">${escapeHtml(user.display_name)}</span>
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
                <span class="prism-tartist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
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
              <span>MIXTAPE: ${escapeHtml(user.display_name).toUpperCase()}</span>
              <span style="font-size:0.6rem; color:#71717a;">${rangeLabel}</span>
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
                <span class="j-artist">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
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

  let totalMs = 0;
  tracks.slice(0, 5).forEach(t => totalMs += (t.duration_ms || 0));

  return `
    <div class="card-inner card-receipt" id="exportable-card">
      <div class="receipt-tear top-tear"></div>

      <div class="receipt-head">
        <h2 class="receipt-logo">RECORD BAR ARCHIVE</h2>
        <div class="receipt-sub">
          <div>SLIP #00${Math.floor(100 + Math.random() * 900)} // SPOTIFY TERMINAL</div>
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
                <span class="r-artist-t">${escapeHtml(track.artists.map(a => a.name).join(', '))}</span>
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
        <div class="r-barcode-note">AUTHENTICATED CLIENT-SIDE VIA SPOTIFY PKCE</div>
        <div class="r-barcode-note" style="font-weight:700; color:#000; margin-top:2px;">SOULSEEKR.APP</div>
      </div>

      <div class="receipt-tear bottom-tear"></div>
    </div>
  `;
}
