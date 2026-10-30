import assert from 'node:assert/strict';

function waveform(amplitudes, frequency = 1000) {
  const sampleRate = 16000;
  const channels = amplitudes.length;
  const samples = sampleRate * 30;
  const wav = Buffer.alloc(44 + samples * channels * 2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * channels * 2, 28);
  wav.writeUInt16LE(channels * 2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  for (let sample = 0; sample < samples; sample++) {
    amplitudes.forEach((amplitude, channel) => wav.writeInt16LE(
      Math.round(Math.sin(2 * Math.PI * frequency * sample / sampleRate) * amplitude * 32767),
      44 + (sample * channels + channel) * 2));
  }
  return wav;
}

export async function checkDapPlayback(page) {
  const audioRoute = 'https://audio.example.test/**';
  const fixtures = {
    'preview.wav': waveform([0.5, 0], 1800),
    'right.wav': waveform([0, 0.5], 100),
    'mono.wav': waveform([0.5]),
    'asymmetric.wav': waveform([0.75, 0.125]),
    'silent.wav': waveform([0, 0])
  };
  await page.route(audioRoute, route => route.fulfill({ contentType: 'audio/wav',
    headers: { 'Access-Control-Allow-Origin': '*' }, body: fixtures[new URL(route.request().url()).pathname.slice(1)] }));
  await page.evaluate(async () => { window.dapEngine = (await import('/js/audio-player.js')).soundEngine; });
  const engineState = () => page.evaluate(() => ({ id: dapEngine.currentTrackId, name: dapEngine.currentTrack?.name,
    request: dapEngine.playRequestId, position: dapEngine.audioElement.currentTime }));
  const assertResting = async status => {
    await page.waitForFunction(text => document.querySelector('.dap-meter-status').textContent.includes(text), status);
    for (const selector of ['.dap-vu-l', '.dap-vu-r']) {
      assert.equal(await page.locator(selector).evaluate(bar => bar.style.transform), 'scaleX(0)');
      assert.equal(await page.locator(selector).locator('..').getAttribute('aria-valuenow'), '0');
    }
  };
  const playFixture = async (name, label = name) => {
    await page.evaluate(async ({ name, label }) => {
      await dapEngine.playTrack({ id: `stereo-fixture-${name}`, name: label, artists: [{ name: 'Stereo fixture artist' }],
        album: { images: [] }, preview_url: `https://audio.example.test/${name}.wav` });
    }, { name, label });
    await page.waitForFunction(() => !dapEngine.lastAudioFrame.isResting && dapEngine.lastAudioFrame.stereoAvailable
      && dapEngine.lastAudioFrame.trackId === dapEngine.currentTrackId);
  };
  try {
    await page.locator('[data-style="dap"]').click();
    await assertResting('PLAY A PREVIEW');
    assert.equal(await page.locator('.dap-vu-l').evaluate(bar => getComputedStyle(bar).animationName), 'none');
    await page.locator('[data-style="gameboy"]').click();
    const track = page.locator('.gb-track-row').nth(1);
    const selectedId = await track.getAttribute('data-track-id');
    const selectedName = await track.locator('.gb-track-name').textContent();
    await track.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => dapEngine.isPlaying && dapEngine.lastAudioFrame.left > 0.2);
    const before = await engineState();
    await page.locator('[data-style="dap"]').click();
    const after = await engineState();
    assert.equal(after.id, selectedId);
    assert.equal(after.request, before.request, 'Switching formats must not restart playback');
    assert.ok(after.position >= before.position, 'Format switching must retain playback position');
    assert.equal(await page.locator('.dap-track-title').textContent(), selectedName);
    assert.equal(await page.locator('.dap-hi-res-badge').textContent(), 'NOW PLAYING');
    assert.equal(await page.locator('.dap-album-art').getAttribute('src'), await page.locator('#dock-thumb').getAttribute('src'));
    await page.waitForFunction(() => Number(document.querySelector('.dap-vu-l').parentElement.getAttribute('aria-valuenow')) > 60);
    assert.equal(await page.locator('.dap-vu-r').locator('..').getAttribute('aria-valuenow'), '0');
    console.log('PASS Retro Handheld keyboard playback follows into Titanium metadata and genuine left-only channel without restarting');

    await page.locator('#np-toggle-btn').click();
    await assertResting('PREVIEW PAUSED');
    assert.equal(await page.locator('.dap-hi-res-badge').textContent(), 'PAUSED');
    await page.locator('[data-style="receipt"]').click();
    await page.locator('[data-style="dap"]').click();
    await assertResting('PREVIEW PAUSED');
    assert.equal(await page.locator('.dap-track-title').textContent(), selectedName);
    await page.locator('#np-toggle-btn').click();
    await page.waitForFunction(() => Number(document.querySelector('.dap-vu-l').parentElement.getAttribute('aria-valuenow')) > 60);
    await page.evaluate(() => dapEngine.audioElement.dispatchEvent(new Event('waiting')));
    await assertResting('BUFFERING PREVIEW');
    await page.evaluate(() => dapEngine.audioElement.dispatchEvent(new Event('playing')));
    await page.waitForFunction(() => document.querySelector('.dap-meter-status').textContent.includes('LIVE LEVELS'));
    await page.evaluate(async () => { await dapEngine.audioContext.suspend(); });
    await assertResting('AUDIO METER UNAVAILABLE');
    await page.evaluate(async () => { await dapEngine.audioContext.resume(); });
    await page.waitForFunction(() => document.querySelector('.dap-meter-status').textContent.includes('LIVE LEVELS'));

    await playFixture('right');
    await page.waitForFunction(() => dapEngine.lastAudioFrame.right > 0.2 && dapEngine.lastAudioFrame.left < 0.0001);
    assert.equal(await page.locator('.dap-vu-l').locator('..').getAttribute('aria-valuenow'), '0');
    assert.ok(Number(await page.locator('.dap-vu-r').locator('..').getAttribute('aria-valuenow')) > 60);
    assert.equal(await page.locator('.dap-track-artist').textContent(), 'Stereo fixture artist');
    assert.equal(await page.locator('.dap-album-art').isVisible(), false);
    assert.equal(await page.locator('.dap-track-row.active').count(), 0, 'Out-of-archive playback must not select an unrelated ranking');
    assert.equal(await page.locator('.dap-track-row').count(), 5);
    await playFixture('mono');
    await page.waitForFunction(() => dapEngine.lastAudioFrame.left > 0.2
      && Math.abs(dapEngine.lastAudioFrame.left - dapEngine.lastAudioFrame.right) < 0.0001);
    await playFixture('asymmetric');
    await page.waitForFunction(() => dapEngine.lastAudioFrame.left > 0.4
      && Math.abs(dapEngine.lastAudioFrame.left / dapEngine.lastAudioFrame.right - 6) < 0.03);
    await page.locator('.card-dap').screenshot({ path: 'test-results/dap-live-stereo-desktop.png' });
    await playFixture('silent');
    await page.waitForFunction(() => dapEngine.lastAudioFrame.left === 0 && dapEngine.lastAudioFrame.right === 0);
    for (const selector of ['.dap-vu-l', '.dap-vu-r']) {
      assert.equal(await page.locator(selector).locator('..').getAttribute('aria-valuenow'), '0');
      assert.equal(await page.locator(selector).locator('..').getAttribute('aria-valuetext'), 'Silent');
    }
    console.log('PASS right-only, mono duplication, asymmetric stereo, digital silence, pause/resume, buffering and suspended audio context');

    await page.evaluate(() => {
      window.dapOriginalResolver = dapEngine.resolveRealAudioPreview;
      dapEngine.resolveRealAudioPreview = () => new Promise(resolve => { window.dapResolvePreview = resolve; });
      window.dapPending = dapEngine.playTrack({ id: 'delayed-dap-preview', name: 'Waiting for a verified preview',
        artists: [{ name: 'Delayed fixture artist' }], album: { images: [] } });
    });
    await assertResting('LOADING PREVIEW');
    assert.equal(await page.locator('.dap-hi-res-badge').textContent(), 'LOADING');
    await page.locator('[data-style="gameboy"]').click();
    await page.locator('[data-style="dap"]').click();
    await assertResting('LOADING PREVIEW');
    assert.equal(await page.locator('.dap-track-title').textContent(), 'Waiting for a verified preview');
    await page.evaluate(async () => {
      dapResolvePreview('https://audio.example.test/mono.wav');
      await dapPending;
      dapEngine.resolveRealAudioPreview = dapOriginalResolver;
    });
    await page.waitForFunction(() => document.querySelector('.dap-meter-status').textContent.includes('LIVE LEVELS'));
    await page.evaluate(() => {
      window.dapStereoAnalysers = dapEngine.stereoAnalysers;
      dapEngine.stereoAnalysers = null;
    });
    await assertResting('AUDIO METER UNAVAILABLE');
    assert.equal(await page.evaluate(() => dapEngine.isPlaying && !dapEngine.audioElement.paused), true);
    await page.evaluate(() => { dapEngine.stereoAnalysers = dapStereoAnalysers; });
    await page.waitForFunction(() => document.querySelector('.dap-meter-status').textContent.includes('LIVE LEVELS'));
    console.log('PASS shared loading state survives format changes and unavailable stereo analysis does not stop playback');

    await playFixture('mono', 'A very long current preview title '.repeat(8));
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('.card-dap').screenshot({ path: 'test-results/dap-long-title-mobile.png' });
    const captionContrast = await page.locator('.dap-meter-status').evaluate(element => {
      const luminance = values => values.map(value => {
        const s = value / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
      const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
      const foreground = luminance(rgb(getComputedStyle(element).color));
      const background = luminance(rgb(getComputedStyle(element.closest('.dap-screen-oled')).backgroundColor));
      return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    assert.ok(captionContrast >= 4.5, `DAP caption contrast is ${captionContrast}:1`);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.ok(parseFloat(await page.locator('.dap-vu-l').evaluate(bar => getComputedStyle(bar).transitionDuration)) <= 0.00001);
    await page.locator('#np-stop-btn').click();
    await assertResting('PLAY A PREVIEW');
    assert.equal(await page.locator('.dap-hi-res-badge').textContent(), 'TOP TRACK');
    assert.notEqual(await page.locator('.dap-track-title').textContent(), 'mono');
    assert.equal(await page.locator('.dap-track-row').count(), 5);
    console.log('PASS DAP mobile long titles, accessible meter values, reduced motion and stop-to-archive reset');
  } finally {
    await page.evaluate(() => {
      dapEngine.stop();
      if (window.dapOriginalResolver) dapEngine.resolveRealAudioPreview = dapOriginalResolver;
      if (window.dapStereoAnalysers) dapEngine.stereoAnalysers = dapStereoAnalysers;
      for (const key of ['dapEngine', 'dapOriginalResolver', 'dapStereoAnalysers', 'dapResolvePreview', 'dapPending']) delete window[key];
    });
    await page.unroute(audioRoute);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
}
