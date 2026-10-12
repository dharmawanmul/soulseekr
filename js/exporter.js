/**
 * Image Exporter Engine
 * Allows downloading cards as high-resolution PNG for Instagram Stories (9:16),
 * Square Posts (1:1), or copying straight to clipboard!
 */

export async function exportCardAsImage(format = 'card', target = null) {
  const cardElement = typeof target === 'string'
    ? document.getElementById(target)
    : (target || document.getElementById('exportable-card'));

  if (!cardElement) {
    throw new Error('Card element not found.');
  }

  if (typeof window.html2canvas === 'undefined') {
    throw new Error('Export engine is loading. Please wait 2 seconds and try again.');
  }

  // Clone or capture with high resolution scaling
  const scale = 2.5; // High-DPI crisp export
  const canvas = await window.html2canvas(cardElement, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false
  });

  if (format === 'story') {
    // Render onto 9:16 canvas suitable for Instagram / TikTok stories (1080 x 1920)
    const storyCanvas = document.createElement('canvas');
    storyCanvas.width = 1080;
    storyCanvas.height = 1920;
    const ctx = storyCanvas.getContext('2d');

    // Create rich dark backdrop
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, '#0a0a0f');
    grad.addColorStop(0.5, '#12121a');
    grad.addColorStop(1, '#08080c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Subtle glow circles in background
    const radial = ctx.createRadialGradient(540, 960, 50, 540, 960, 600);
    radial.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1080, 1920);

    // Calculate scaling to center card
    const targetW = 920;
    const targetH = (canvas.height / canvas.width) * targetW;
    const targetX = (1080 - targetW) / 2;
    const targetY = (1920 - targetH) / 2;

    // Draw card drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.drawImage(canvas, targetX, targetY, targetW, targetH);

    // Add watermark
    ctx.shadowColor = 'transparent';
    ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('SOULSEEKR // SPOTIFY EXPERIENCE', 540, 1850);

    return storyCanvas.toDataURL('image/png');
  } else if (format === 'square') {
    // Render onto 1:1 canvas (1200 x 1200)
    const sqCanvas = document.createElement('canvas');
    sqCanvas.width = 1200;
    sqCanvas.height = 1200;
    const ctx = sqCanvas.getContext('2d');

    // Dark gradient — correct direction: top-to-bottom
    const grad = ctx.createLinearGradient(0, 0, 0, 1200);
    grad.addColorStop(0, '#0c0d14');
    grad.addColorStop(1, '#050608');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 1200);

    const targetH = 1050;
    const targetW = (canvas.width / canvas.height) * targetH;
    const targetX = (1200 - targetW) / 2;
    const targetY = (1200 - targetH) / 2;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;

    ctx.drawImage(canvas, targetX, targetY, targetW, targetH);
    return sqCanvas.toDataURL('image/png');
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

  const canvas = await window.html2canvas(cardElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: null
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
