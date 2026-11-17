import { readFileSync } from 'node:fs';
import type { Connect } from 'vite';

export function serveLegalDocuments(directory: URL): Connect.NextHandleFunction {
  // Allowlist lấy từ manifest để local khớp các dòng COPY trong Dockerfile.
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8')) as {
    file: string;
  }[];
  const published = new Set(manifest.map(({ file }) => `/${file}`));
  return (request, response, next) => {
    const pathname = request.url?.split('?')[0] ?? '';
    if (!pathname.startsWith('/legal/')) return next();
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'same-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    if (!published.has(pathname)) {
      response.statusCode = 404;
      return response.end();
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.statusCode = 405;
      response.setHeader('Allow', 'GET, HEAD');
      return response.end();
    }
    try {
      const content = readFileSync(new URL(pathname.slice('/legal/'.length), directory));
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.setHeader('Cache-Control', 'no-cache');
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      next(error);
    }
  };
}
