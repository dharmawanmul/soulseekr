import { previewMeterLevel } from './audio-analysis.js';
import { getTimeRangeLabel, getTrackArtistNames } from './card-renderer.js';

function setText(element, text) {
  if (element && element.textContent !== text) element.textContent = text;
}

function updateSpecs(card, engine, trackId, catalogTempo) {
  const bpm = engine.getTrackAcoustics(trackId)?.bpm;
  const tempo = bpm || (Number.isFinite(catalogTempo) ? Math.round(catalogTempo) : null);
  setText(card.querySelector('.dap-audio-specs'), bpm
    ? `ESTIMATED PREVIEW TEMPO • ${bpm} BPM`
    : trackId === engine.currentTrackId && engine.currentTrack?.source === 'generated' ? 'LOCAL INSTRUMENTAL'
    : `SPOTIFY CATALOG METADATA${tempo ? ` • ${tempo} BPM` : ''}`);
}

export function updateDapPlayback(card, engine, data, timeRange) {
  if (!card) return;
  const active = Boolean(engine.currentTrack && (engine.isPlaying || engine.isPaused || engine.isLoading));
  const track = active ? engine.currentTrack : data?.topTracks?.[0];
  const hero = card.querySelector('.dap-hero-track');
  hero.dataset.trackId = track?.id || '';
  setText(card.querySelector('.dap-track-title'), track?.name || 'No tracks in this archive');
  setText(card.querySelector('.dap-track-artist'), track ? getTrackArtistNames(track) : '');
  setText(card.querySelector('.dap-status-mode'), active ? 'SHARED PREVIEW PLAYER' : 'LISTENING ARCHIVE');
  setText(card.querySelector('.dap-hi-res-badge'), active
    ? (engine.isLoading ? 'LOADING' : engine.isPaused ? 'PAUSED' : 'NOW PLAYING') : 'TOP TRACK');
  setText(card.querySelector('.dap-track-rank'), active
    ? (track.source === 'generated' ? 'LOCAL INSTRUMENTAL' : 'CURRENT PREVIEW')
    : `TOP FREQUENCY • ${getTimeRangeLabel(timeRange)}`);

  const artwork = card.querySelector('.dap-album-art');
  let cover = '';
  try {
    const url = new URL(track?.album?.images?.[0]?.url);
    if (['https:', 'http:'].includes(url.protocol)) cover = url.href;
  } catch { /* A track without artwork keeps the display text-only. */ }
  artwork.onerror = () => { artwork.hidden = true; };
  if (artwork.getAttribute('src') !== (cover || null)) {
    artwork.hidden = !cover;
    if (cover) artwork.src = cover;
    else artwork.removeAttribute('src');
  }
  updateSpecs(card, engine, track?.id, active ? null : data?.stats?.tempoBpm);
  updateDapAudioFrame(card, engine, engine.lastAudioFrame);
}

export function updateDapAudioFrame(card, engine, frame) {
  if (!card) return;
  const live = engine.isPlaying && !engine.isLoading && !frame.isResting
    && frame.stereoAvailable && frame.trackId === engine.currentTrackId;
  for (const [channel, selector] of [['left', '.dap-vu-l'], ['right', '.dap-vu-r']]) {
    const level = live ? previewMeterLevel(frame[channel]) : 0;
    const bar = card.querySelector(selector);
    bar.style.transform = `scaleX(${level.toFixed(3)})`;
    bar.parentElement.setAttribute('aria-valuenow', String(Math.round(level * 100)));
    bar.parentElement.setAttribute('aria-valuetext', live
      ? (frame[channel] > 0 ? `${(20 * Math.log10(frame[channel])).toFixed(1)} dBFS RMS` : 'Silent')
      : 'No active signal');
  }
  const status = engine.isLoading ? 'LOADING PREVIEW'
    : engine.isPaused ? 'PREVIEW PAUSED'
      : !engine.isPlaying ? 'PLAY A PREVIEW FOR LIVE L/R'
        : frame.isBuffering ? 'BUFFERING PREVIEW'
          : live ? 'LIVE LEVELS • RMS / dBFS'
            : engine.stereoAnalysers && engine.audioContext?.state === 'running'
              ? 'READING PREVIEW AUDIO' : 'AUDIO METER UNAVAILABLE';
  setText(card.querySelector('.dap-meter-status'), status);
  if (live && card.querySelector('.dap-hero-track').dataset.trackId === engine.currentTrackId) {
    updateSpecs(card, engine, engine.currentTrackId, null);
  }
}
