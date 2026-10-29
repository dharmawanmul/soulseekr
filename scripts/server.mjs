import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };

export function createStaticServer(root = process.cwd()) {
  return createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const target = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      const local = relative(root, target);
      if (local.startsWith('..') || isAbsolute(local) || local.split(/[\\/]/).some(part => part.startsWith('.') || part === 'node_modules')) {
        response.writeHead(403).end();
        return;
      }
      const info = await stat(target);
      if (!info.isFile()) throw new Error('Not a file');
      response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream',
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      createReadStream(target).on('error', () => response.destroy()).pipe(response);
    } catch {
      response.writeHead(404).end();
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const port = Number(process.env.PORT || 5173);
  createStaticServer().listen(port, '127.0.0.1', () => console.log(`Soulseekr: http://127.0.0.1:${port}/`));
}
