import { escapeHtml } from './card-renderer.js';

export function storyImageSource(url) {
  if (typeof url !== 'string' || !url.trim()) return null;
  let source;
  try {
    source = new URL(url, typeof document === 'undefined' ? 'http://localhost/' : document.baseURI);
  } catch {
    return null;
  }
  return ['http:', 'https:'].includes(source.protocol) ? source.href : null;
}

export function storyArtwork(url, className) {
  const classes = escapeHtml(String(className));
  const source = storyImageSource(url);
  if (!source) return `<span class="${classes} story-artwork-placeholder" aria-hidden="true"></span>`;
  return `<img class="${classes}" src="${escapeHtml(source)}" alt="" data-story-artwork>`;
}

export function storyPercentage(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const percentage = Number(value);
  return Number.isFinite(percentage) && percentage >= 0 && percentage <= 100 ? percentage : null;
}

export function attachStoryArtworkFallbacks(container) {
  for (const image of container.querySelectorAll('img[data-story-artwork]')) {
    const replace = () => {
      const placeholder = image.ownerDocument.createElement('span');
      placeholder.className = `${image.className} story-artwork-placeholder`;
      placeholder.setAttribute('aria-hidden', 'true');
      image.replaceWith(placeholder);
    };
    if (image.complete && !image.naturalWidth) replace();
    else image.addEventListener('error', replace, { once: true });
  }
}
