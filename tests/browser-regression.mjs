import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { createStaticServer } from '../scripts/server.mjs';

const server = createStaticServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH }
    : process.env.BROWSER_CHANNEL === 'chromium' ? {} : { channel: 'chrome' }),
  headless: true,
  args: ['--disable-breakpad', '--disable-crash-reporter', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
const expectedFailedRequests = new Set();
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') {
    if (message.text().includes('503') && expectedFailedRequests.has(message.location().url)) return;
    errors.push(message.text());
  }
});
const libraries = {
  'three.min.js': await readFile('node_modules/three/build/three.min.js'),
  'html2canvas.min.js': await readFile('node_modules/html2canvas/dist/html2canvas.min.js')
};
const wav = Buffer.alloc(44 + 44100 * 5 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(44100, 24); wav.writeUInt32LE(88200, 28); wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
for (let i = 0; i < (wav.length - 44) / 2; i++) wav.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 100 * i / 44100) * 10000), 44 + i * 2);
let sample;
let phase = 'initial';
let mediumCalls = 0;
let comparisonsFail = false;
let requests = [];

await context.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.origin === base) return route.continue();
  const library = Object.keys(libraries).find(name => url.pathname.endsWith(name));
  if (library) return route.fulfill({ contentType: 'text/javascript', body: libraries[library] });
  if (url.hostname === 'api.spotify.com') {
    requests.push(url.href);
    const range = url.searchParams.get('time_range') || 'short_term';
    if (url.pathname.endsWith('/me')) return route.fulfill({ json: sample.user });
    if (url.pathname.endsWith('/recently-played')) return route.fulfill({ json: { items: [] } });
    if (url.pathname.endsWith('/top/tracks')) {
      if (range === 'medium_term' && phase === 'race' && ++mediumCalls === 1) await new Promise(resolve => setTimeout(resolve, 600));
      if (range !== 'short_term' && comparisonsFail) {
        expectedFailedRequests.add(url.href);
        return route.fulfill({ status: 503, json: { error: { message: 'Unavailable fixture' } } });
      }
      if (phase === 'comparisons' && range !== 'short_term') await new Promise(resolve => setTimeout(resolve, 100));
      return route.fulfill({ json: { items: sample.topTracks.map(track => ({ ...track, name: `${range}: ${track.name}` })) } });
    }
    if (url.pathname.endsWith('/top/artists')) return route.fulfill({ json: { items: sample.topArtists } });
  }
  if (url.hostname === 'itunes.apple.com') return route.fulfill({ json: { results: sample.topTracks.map(track => ({
    trackName: track.name, artistName: track.artists[0].name, trackTimeMillis: track.duration_ms,
    previewUrl: 'https://audio.example.test/preview.wav'
  })) } });
  if (url.hostname === 'audio.example.test') return route.fulfill({ contentType: 'audio/wav', headers: { 'Access-Control-Allow-Origin': '*' }, body: wav });
  if (/\.(?:png|jpe?g|webp)$/.test(url.pathname) || /unsplash|scdn.co/.test(url.hostname)) {
    return route.fulfill({ contentType: 'image/svg+xml', headers: { 'Access-Control-Allow-Origin': '*' },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" fill="#524538"/><circle cx="150" cy="150" r="100" fill="#d8c9aa"/></svg>' });
  }
  return route.fulfill({ status: 204, body: '' });
});

const cardText = () => page.locator('#card-display-container').innerText();
const waitForRange = range => page.waitForFunction(value => document.querySelector('#card-display-container').textContent.includes(value + ':'), range);
const setConnected = () => page.evaluate(() => {
  localStorage.setItem('vibe_access_token', 'fixture-token');
  localStorage.setItem('vibe_refresh_token', 'fixture-refresh');
  localStorage.setItem('vibe_token_expires_at', String(Date.now() + 3600000));
  sessionStorage.setItem('soulseekr_time_range', 'short_term');
});

try {
  await mkdir('test-results', { recursive: true });
  await page.goto(base, { waitUntil: 'networkidle' });
  sample = await page.evaluate(async () => (await import('/js/app.js')).DEFAULT_CURATED_DATA);
  assert.equal(await page.locator('#auth-gateway-modal').getAttribute('aria-hidden'), 'true');
  for (const style of ['vinyl', 'swiss', 'prism', 'cassette', 'receipt', 'dap', 'gameboy', 'vippass']) {
    await page.locator(`[data-style="${style}"]`).click();
    assert.equal(await page.locator('#exportable-card').count(), 1);
    const exported = await page.evaluate(async () => {
      const data = await (await import('/js/exporter.js')).exportCardAsImage('card');
      const image = new Image(); image.src = data; await image.decode();
      return { width: image.width, height: image.height, bytes: data.length };
    });
    assert.ok(exported.width > 0 && exported.height > 0 && exported.bytes > 5000, `Empty ${style} export`);
  }
  for (const [button, width, height] of [['story', 1080, 1920], ['square', 1200, 1200], ['poster', 1200, 1600]]) {
    const downloadPromise = page.waitForEvent('download');
    await page.locator(`#btn-export-${button}`).click();
    const download = await downloadPromise;
    const png = await readFile(await download.path());
    assert.equal(png.readUInt32BE(16), width); assert.equal(png.readUInt32BE(20), height);
  }
  await page.locator('#btn-connect-spotify').click();
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'btn-gateway-connect');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'btn-connect-spotify');
  console.log('PASS sample, eight real card exports, 9:16/1:1/3:4 downloads, gateway keyboard focus');

  requests = [];
  await setConnected();
  await page.reload({ waitUntil: 'networkidle' });
  await waitForRange('short_term');
  assert.equal(requests.length, 4, 'Main artifact eagerly requested comparisons');
  phase = 'race';
  await page.locator('[data-range="medium_term"]').click();
  await page.locator('[data-range="long_term"]').click();
  await waitForRange('long_term');
  await page.waitForTimeout(800);
  assert.match(await cardText(), /long_term:/);
  await page.locator('[data-range="medium_term"]').click();
  await waitForRange('medium_term');
  phase = 'initial';
  await setConnected();
  await page.reload({ waitUntil: 'networkidle' });
  phase = 'race'; mediumCalls = 0;
  await page.locator('[data-range="medium_term"]').click();
  await page.locator('#btn-logout').click();
  await page.waitForTimeout(800);
  assert.doesNotMatch(await cardText(), /medium_term:/);
  assert.equal(await page.locator('[data-range="medium_term"]').isDisabled(), true);
  console.log('PASS selected-window request count, out-of-order responses, disconnect during loading');

  phase = 'initial';
  await setConnected();
  await page.reload({ waitUntil: 'networkidle' });
  phase = 'comparisons'; comparisonsFail = true;
  await page.locator('#btn-open-dossier').click();
  await page.locator('[data-dept="audiodna"]').click();
  await page.waitForSelector('#btn-retry-comparisons');
  assert.match(await page.locator('#dossier-exportable-stage').innerText(), /Some comparison windows are unavailable/);
  await page.screenshot({ path: 'test-results/comparison-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const retryFits = await page.locator('#btn-retry-comparisons').evaluate(button =>
    button.clientWidth >= button.scrollWidth && button.clientHeight >= button.scrollHeight);
  assert.equal(retryFits, true, 'Mobile comparison retry label is clipped');
  await page.screenshot({ path: 'test-results/comparison-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  comparisonsFail = false;
  const beforeRetry = requests.length;
  await page.locator('#btn-retry-comparisons').click();
  await page.waitForFunction(async () => (await import('/js/dossier.js')).sonicDossier.data.comparisonLoadState === 'ready');
  assert.equal(requests.length - beforeRetry, 4);
  await page.locator('[data-sub="comparison"]').click();
  assert.equal(await page.locator('[data-comparison-side]').count(), 2);
  assert.equal(await page.locator('.comparison-track-list').count(), 2);
  const beforeReopen = requests.length;
  await page.locator('[data-dept="cinema"]').click();
  await page.locator('[data-dept="audiodna"]').click();
  assert.equal(requests.length, beforeReopen);
  await page.keyboard.press('Escape');
  console.log('PASS lazy Audio DNA loading, partial failure, retry, period comparison, cache reuse');

  await page.evaluate(async () => {
    window.wrapped = (await import('/js/wrapped-experience.js')).wrappedExperience;
    window.wrapped.isMuted = true;
  });
  await page.locator('#btn-open-wrapped').click();
  await page.waitForFunction(() => window.wrapped.visualizer?.isRunning);
  await page.locator('#btn-wrapped-pause').click();
  assert.equal(await page.locator('#btn-wrapped-pause').getAttribute('aria-pressed'), 'true');
  await page.locator('#wrapped-nav-next').click();
  assert.equal(await page.evaluate(() => wrapped.currentSlideIndex), 1);
  assert.equal(await page.evaluate(() => wrapped.isPaused), true);
  await page.mouse.wheel(0, 500);
  assert.equal(await page.evaluate(() => wrapped.currentSlideIndex), 1);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.locator('#btn-wrapped-pause').click();
  assert.equal(await page.evaluate(() => wrapped.isPaused), true);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  assert.equal(await page.evaluate(() => wrapped.isPaused), false);
  await page.locator('#btn-wrapped-pause').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => wrapped.pauseReasons.has('user')), true);
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/wrapped-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  const mobile = await page.locator('#btn-wrapped-pause').evaluate(button => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height, right: rect.right, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.ok(mobile.width >= 44 && mobile.height >= 44 && mobile.right <= 390 && !mobile.overflow);
  await page.screenshot({ path: 'test-results/wrapped-mobile.png' });
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    wrapped.visualizer.destroy(); wrapped.visualizer = null; wrapped.canvas.getContext = () => null;
    wrapped.open(wrapped.data);
  });
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => wrapped.visualizer), null);
  await page.keyboard.press('Escape');
  console.log('PASS real Three.js background, WebGL fallback, pause, hidden tab, keyboard and mobile controls');

  await page.evaluate(async () => {
    const { soundEngine } = await import('/js/audio-player.js');
    const { DEFAULT_CURATED_DATA } = await import('/js/app.js');
    await soundEngine.playTrack(DEFAULT_CURATED_DATA.topTracks[0]);
  });
  assert.equal(await page.evaluate(async () => (await import('/js/audio-player.js')).soundEngine.isPlaying), true);
  await page.locator('#np-toggle-btn').click();
  assert.equal(await page.evaluate(async () => (await import('/js/audio-player.js')).soundEngine.isPaused), true);
  await page.locator('#np-toggle-btn').click();
  assert.equal(await page.evaluate(async () => (await import('/js/audio-player.js')).soundEngine.isPlaying), true);
  await page.locator('#np-stop-btn').click();
  assert.equal(await page.evaluate(async () => (await import('/js/audio-player.js')).soundEngine.currentTrackId), null);
  console.log('PASS matched catalog preview, real audio playback, pause/resume/stop');
  assert.deepEqual(errors, [], 'Unexpected browser console/page errors');
  console.log('PASS no browser runtime errors (Spotify/Apple responses and artwork use test fixtures)');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
