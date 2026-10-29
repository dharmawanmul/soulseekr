export const INSTRUMENTAL_TRACK = {
  id: 'soulseekr-story-instrumental',
  name: 'Soulseekr instrumental',
  artists: [{ name: 'Generated on this device' }],
  source: 'generated'
};

export async function playStorySoundtrack({ engine, preferred, tracks, previous, used, failed,
  budget, isCurrent, onAttempt }) {
  const candidates = tracks.filter(track => track?.id && !failed.has(track.id));
  const fresh = candidates.filter(track => !used.has(track.id) && track.id !== preferred?.id);
  fresh.sort((a, b) => Number(Boolean(b.preview_url)) - Number(Boolean(a.preview_url)));
  const reusable = candidates.filter(track => track.preview_url && used.has(track.id));
  const queue = [preferred, ...fresh.filter(track => track.preview_url), previous,
    ...reusable, ...fresh.filter(track => !track.preview_url)];
  const attempted = new Set();
  for (const track of queue) {
    if (!isCurrent()) return { status: 'cancelled' };
    if (!track?.id || track.source === 'generated' || attempted.has(track.id) || failed.has(track.id)) continue;
    if (budget.remaining <= 0) break;
    if (typeof navigator !== 'undefined' && navigator.onLine === false && !track.preview_url) continue;
    attempted.add(track.id);
    budget.remaining--;
    onAttempt(track);
    const result = await engine.playTrack(track, { restart: true, silentFailure: true, playTimeoutMs: 4000 });
    if (!isCurrent()) return { status: 'cancelled' };
    if (result?.status === 'cancelled' || result?.status === 'blocked') return result;
    if (result?.status === 'playing') {
      used.add(track.id);
      return { ...result, track, fallback: track.id !== preferred?.id };
    }
    failed.add(track.id);
  }
  if (!isCurrent()) return { status: 'cancelled' };
  onAttempt(INSTRUMENTAL_TRACK);
  return engine.playInstrumental();
}
