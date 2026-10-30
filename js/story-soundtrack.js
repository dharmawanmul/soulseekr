export const INSTRUMENTAL_TRACK = {
  id: 'soulseekr-story-instrumental',
  name: 'Soulseekr instrumental',
  artists: [{ name: 'Generated on this device' }],
  source: 'generated'
};

export function soundtrackCandidates({ preferred, tracks, previous, used, failed, reusePreferred = false }) {
  const byId = new Map();
  for (const track of [preferred, ...tracks]) {
    if (!track?.id || track.source === 'generated' || track.id === previous?.id
        || failed.has(track.id)) continue;
    if (!byId.has(track.id) || (!byId.get(track.id).preview_url && track.preview_url)) byId.set(track.id, track);
  }
  const candidates = [...byId.values()];
  const ownPreferred = candidates.find(track => track.id === preferred?.id
    && (reusePreferred || !used.has(track.id)));
  const fresh = candidates.filter(track => !used.has(track.id) && track !== ownPreferred);
  fresh.sort((a, b) => Number(Boolean(b.preview_url)) - Number(Boolean(a.preview_url)));
  const recency = new Map([...used].map((id, index) => [id, index]));
  const recycled = candidates.filter(track => used.has(track.id) && track !== ownPreferred);
  recycled.sort((a, b) => recency.get(a.id) - recency.get(b.id));
  return [...(ownPreferred ? [ownPreferred] : []), ...fresh, ...recycled];
}

export async function playStorySoundtrack({ engine, preferred, tracks, previous, used, failed,
  budget, isCurrent, onAttempt, reusePreferred = false, allowInstrumental = true }) {
  const queue = soundtrackCandidates({ preferred, tracks, previous, used, failed, reusePreferred });
  const lookups = new Map();
  const prefetch = index => {
    if (!engine.resolveRealAudioPreview || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    for (const track of queue.slice(index, index + 3)) {
      if (track.preview_url || lookups.has(track.id)) continue;
      const artist = track.artists?.[0];
      const artistName = typeof artist === 'string' ? artist : artist?.name || track.artistName || '';
      lookups.set(track.id, Promise.resolve().then(() =>
        engine.resolveRealAudioPreview(track.name, artistName, track.duration_ms)).catch(() => null));
    }
  };
  if (!isCurrent()) return { status: 'cancelled' };
  engine.stop?.();
  for (let index = 0; index < queue.length; index++) {
    const track = queue[index];
    if (!isCurrent()) return { status: 'cancelled' };
    if (budget.remaining <= 0) return { status: 'unavailable', reason: 'search-budget' };
    if (typeof navigator !== 'undefined' && navigator.onLine === false && !track.preview_url) continue;
    prefetch(index);
    budget.remaining--;
    onAttempt(track);
    if (!track.preview_url && lookups.has(track.id)) {
      const url = await lookups.get(track.id);
      if (!isCurrent()) return { status: 'cancelled' };
      if (!url) { failed.add(track.id); continue; }
      track.preview_url = url;
    }
    const result = await engine.playTrack(track, { restart: true, silentFailure: true, playTimeoutMs: 4000 });
    if (!isCurrent()) return { status: 'cancelled' };
    if (result?.status === 'cancelled' || result?.status === 'blocked') return result;
    if (result?.status === 'playing') {
      used.delete(track.id);
      used.add(track.id);
      return { ...result, track, fallback: track.id !== preferred?.id };
    }
    failed.add(track.id);
  }
  if (!isCurrent()) return { status: 'cancelled' };
  if (!allowInstrumental) return { status: 'unavailable' };
  onAttempt(INSTRUMENTAL_TRACK);
  return engine.playInstrumental();
}
