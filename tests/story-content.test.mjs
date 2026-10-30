import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storyArtwork, storyImageSource, storyPercentage, attachStoryArtworkFallbacks } from '../js/story-content.js';

test('missing artwork preserves its layout slot without an empty image request', () => {
  for (const url of [null, undefined, '', ' ', {}, 'javascript:alert(1)', 'data:text/html,unsafe']) {
    const html = storyArtwork(url, 'ladder-thumb');
    assert.match(html, /class="ladder-thumb story-artwork-placeholder"/);
    assert.match(html, /aria-hidden="true"/);
    assert.doesNotMatch(html, /<img|src=/);
  }
});

test('artwork URLs permit HTTP images and resolve relative assets', () => {
  assert.equal(storyImageSource('https://images.example/cover.jpg'), 'https://images.example/cover.jpg');
  assert.equal(storyImageSource('/assets/cover.png'), 'http://localhost/assets/cover.png');
  assert.equal(storyImageSource('http://['), null);
  assert.equal(storyImageSource('file:///private/image.png'), null);
  assert.equal(storyImageSource('blob:example'), null);
});

test('artwork URL and class strings cannot break out of their attributes', () => {
  const html = storyArtwork('https://images.example/cover?q=" onerror="unsafe', 'art" data-injected="true');
  assert.match(html, /q=%22/);
  assert.match(html, /art&quot; data-injected=&quot;true/);
  assert.doesNotMatch(html, /" onerror="|class="art" data-injected=/);
  assert.match(html, /alt="" data-story-artwork/);
});

function imageFixture(complete, naturalWidth) {
  let replacements = 0;
  let replacement;
  const image = new EventTarget();
  Object.assign(image, {
    complete, naturalWidth, className: 'album-mini-art',
    ownerDocument: { createElement: () => ({ setAttribute(name, value) { this[name] = value; } }) },
    replaceWith(value) { replacements++; replacement = value; }
  });
  return { image, container: { querySelectorAll: () => [image] },
    replacements: () => replacements, replacement: () => replacement };
}

test('an image load failure replaces the image with a same-size decorative slot once', () => {
  const f = imageFixture(false, 0);
  attachStoryArtworkFallbacks(f.container);
  f.image.dispatchEvent(new Event('error'));
  f.image.dispatchEvent(new Event('error'));
  assert.equal(f.replacements(), 1);
  assert.equal(f.replacement().className, 'album-mini-art story-artwork-placeholder');
  assert.equal(f.replacement()['aria-hidden'], 'true');
});

test('cached broken images get fallbacks immediately, while loaded images remain', () => {
  const broken = imageFixture(true, 0);
  attachStoryArtworkFallbacks(broken.container);
  assert.equal(broken.replacements(), 1);
  const loaded = imageFixture(true, 300);
  attachStoryArtworkFallbacks(loaded.container);
  assert.equal(loaded.replacements(), 0);
});

test('genre percentages accept valid numbers without accepting HTML or invalid metrics', () => {
  assert.equal(storyPercentage(0), 0);
  assert.equal(storyPercentage('42.5'), 42.5);
  assert.equal(storyPercentage(100), 100);
  for (const value of [null, undefined, '', ' ', {}, [], true, -1, 101, Infinity,
    '<img onerror="unsafe">', '1; background: red']) assert.equal(storyPercentage(value), null);
});
