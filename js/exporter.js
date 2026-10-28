/**
 * Image Exporter Engine
 * Allows downloading cards as high-resolution PNG for Instagram Stories (9:16),
 * Square Posts (1:1), or copying straight to clipboard!
 */

let html2canvasPromise = null;

/**
 * Lazy-load html2canvas on demand when the user triggers an export or copy action
 */
export async function ensureHtml2CanvasLoaded() {
  if (typeof window.html2canvas !== 'undefined') {
    return window.html2canvas;
  }
  if (!html2canvasPromise) {
    html2canvasPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve(window.html2canvas);
      script.onerror = () => {
        html2canvasPromise = null;
        reject(new Error('Export engine failed to load. Please check your internet connection.'));
      };
      document.head.appendChild(script);
    });
  }
  return html2canvasPromise;
}

export async function exportCardAsImage(format = 'card', target = null) {
  const cardElement = typeof target === 'string'
    ? document.getElementById(target)
    : (target || document.getElementById('exportable-card'));

  if (!cardElement) {
    throw new Error('Card element not found.');
  }

  await ensureHtml2CanvasLoaded();
  await document.fonts?.ready;

  const scale = 2.5;
  const canvas = await window.html2canvas(cardElement, {
    scale: scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    imageTimeout: 8000
  });

  if (format === 'story') {
    // Render onto 9:16 canvas suitable for Instagram / TikTok stories (1080 x 1920)
    const storyCanvas = document.createElement('canvas');
    storyCanvas.width = 1080;
    storyCanvas.height = 1920;
    const ctx = storyCanvas.getContext('2d');

    // Create rich dark backdrop
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, '#171510');
    grad.addColorStop(0.58, '#11100d');
    grad.addColorStop(1, '#0c0b09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Subtle glow circles in background
    const radial = ctx.createRadialGradient(540, 960, 50, 540, 960, 600);
    radial.addColorStop(0, 'rgba(237, 106, 69, 0.14)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1080, 1920);

    // Calculate scaling to center card within story boundaries
    const maxStoryW = 920;
    const maxStoryH = 1520;
    const scaleStory = Math.min(maxStoryW / canvas.width, maxStoryH / canvas.height);
    const targetW = canvas.width * scaleStory;
    const targetH = canvas.height * scaleStory;
    const targetX = (1080 - targetW) / 2;
    const targetY = (1920 - targetH) / 2;

    // Draw card drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.drawImage(canvas, targetX, targetY, targetW, targetH);

    // Add watermark
    ctx.shadowColor = 'transparent';
    ctx.font = '500 24px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(242, 234, 217, 0.62)';
    ctx.textAlign = 'center';
    ctx.fillText('SOULSEEKR / LISTENING ARCHIVE', 540, 1850);

    return storyCanvas.toDataURL('image/png');
  } else if (format === 'square') {
    // Render onto 1:1 canvas (1200 x 1200)
    const sqCanvas = document.createElement('canvas');
    sqCanvas.width = 1200;
    sqCanvas.height = 1200;
    const ctx = sqCanvas.getContext('2d');

    // Dark gradient with smooth top-to-bottom transition
    const grad = ctx.createLinearGradient(0, 0, 0, 1200);
    grad.addColorStop(0, '#11100d');
    grad.addColorStop(1, '#090907');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1200);

    // Fit with aspect ratio preservation to prevent clipping on wide cards
    const maxSquareDim = 1040;
    const scaleSq = Math.min(maxSquareDim / canvas.width, maxSquareDim / canvas.height);
    const targetW = canvas.width * scaleSq;
    const targetH = canvas.height * scaleSq;
    const targetX = (1200 - targetW) / 2;
    const targetY = (1200 - targetH) / 2;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;

    ctx.drawImage(canvas, targetX, targetY, targetW, targetH);
    return sqCanvas.toDataURL('image/png');
  } else if (format === 'poster') {
    // Render onto 3:4 portrait canvas (1200 x 1600) suitable for gallery prints and physical posters
    const posterCanvas = document.createElement('canvas');
    posterCanvas.width = 1200;
    posterCanvas.height = 1600;
    const ctx = posterCanvas.getContext('2d');

    // Rich warm museum dark backdrop
    const grad = ctx.createLinearGradient(0, 0, 1200, 1600);
    grad.addColorStop(0, '#171510');
    grad.addColorStop(0.6, '#11100d');
    grad.addColorStop(1, '#0c0b09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1600);

    // Fine editorial border hairline
    ctx.strokeStyle = 'rgba(242, 234, 217, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, 1200 - 96, 1600 - 96);

    // Fit with aspect ratio preservation
    const maxPosterW = 1000;
    const maxPosterH = 1320;
    const scalePoster = Math.min(maxPosterW / canvas.width, maxPosterH / canvas.height);
    const targetW = canvas.width * scalePoster;
    const targetH = canvas.height * scalePoster;
    const targetX = (1200 - targetW) / 2;
    const targetY = (1500 - targetH) / 2;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;

    ctx.drawImage(canvas, targetX, targetY, targetW, targetH);

    // Bottom colophon
    ctx.shadowColor = 'transparent';
    ctx.font = '500 18px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(242, 234, 217, 0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('SOULSEEKR / ARCHIVE EDITION / 3:4 GALLERY PRINT', 600, 1540);

    return posterCanvas.toDataURL('image/png');
  }

  return canvas.toDataURL('image/png');
}

/**
 * Trigger download of generated image
 */
export function downloadDataUrl(dataUrl, filename = 'soulseekr-card.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy image to clipboard if supported
 */
export async function copyCardToClipboard(target = null) {
  const cardElement = typeof target === 'string'
    ? document.getElementById(target)
    : (target || document.getElementById('exportable-card'));
  if (!cardElement) throw new Error('Card not found');

  await ensureHtml2CanvasLoaded();
  await document.fonts?.ready;

  const canvas = await window.html2canvas(cardElement, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
    imageTimeout: 8000
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create image blob.'));
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        resolve();
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}
