import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createStaticServer } from '../scripts/server.mjs';

const server = createStaticServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH }
    : process.env.BROWSER_CHANNEL === 'chromium' ? {} : { channel: 'chrome' }),
  headless: true
});
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('#exportable-card');
  for (const width of [320, 375, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('.export-actions button')];
      const labels = buttons.map(button => {
        const text = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        const range = document.createRange();
        range.selectNodeContents(text);
        return { text: text.textContent.trim(), rects: range.getClientRects().length,
          height: button.getBoundingClientRect().height };
      });
      const type = [...document.querySelectorAll('.time-btn, .brand-tagline, .studio-index, .stage-heading-label, .demo-text, .demo-connect-link')]
        .filter(element => element.getClientRects().length)
        .map(element => ({ text: element.textContent.trim(), size: parseFloat(getComputedStyle(element).fontSize) }));
      return { overflow: document.documentElement.scrollWidth > innerWidth, labels, type };
    });
    assert.equal(layout.overflow, false, `Horizontal overflow at ${width}px`);
    for (const label of layout.labels) {
      assert.equal(label.rects, 1, `${label.text} wraps at ${width}px`);
      assert.ok(label.height >= 44, `${label.text} has a small tap target at ${width}px`);
    }
    for (const label of layout.type) assert.ok(label.size >= 11, `${label.text} is too small at ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#btn-connect-spotify').focus();
  const focus = await page.locator('#btn-connect-spotify').evaluate(button => {
    const style = getComputedStyle(button);
    return { outline: style.outlineStyle, width: parseFloat(style.outlineWidth), transition: style.transitionDuration };
  });
  assert.notEqual(focus.outline, 'none');
  assert.ok(focus.width >= 2);
  assert.ok(parseFloat(focus.transition) <= 0.00001, 'Reduced motion must remove perceptible transition duration');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#auth-gateway-modal.is-open');
  const gateway = await page.locator('.auth-gateway-card').evaluate(card => {
    const rect = card.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: innerWidth };
  });
  assert.ok(gateway.left >= 0 && gateway.right <= gateway.width);
  for (const selector of ['#btn-gateway-connect', '#btn-gateway-demo']) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    const button = await page.locator(selector).boundingBox();
    assert.ok(button.height >= 44 && button.width <= 390);
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#auth-gateway-modal').getAttribute('aria-hidden'), 'true');
  assert.match(await page.locator('.studio-index').innerText(), /Eight collectible editions/);
  assert.deepEqual(errors, []);
  console.log('PASS 320–1920px layout, single-line exports, readable labels, keyboard gateway, focus and reduced motion');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
