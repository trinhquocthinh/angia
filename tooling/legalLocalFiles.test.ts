import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { serveLegalDocuments } from '../apps/web/serveLegalDocuments.js';

const middleware = serveLegalDocuments(new URL('../legal/', import.meta.url));

function request(url: string, method = 'GET') {
  const response = { statusCode: 200, setHeader: vi.fn(), end: vi.fn() };
  const next = vi.fn();
  middleware(
    { url, method } as Parameters<typeof middleware>[0],
    response as unknown as Parameters<typeof middleware>[1],
    next,
  );
  return { response, next };
}

describe('Văn bản pháp lý trên local', () => {
  it.each([
    'terms.md',
    'privacy.md',
    'terms-v0-1-draft.md',
    'privacy-v0-1-draft.md',
    'terms-v0-2-draft.md',
    'privacy-v0-2-draft.md',
  ])('TC-752: đọc công khai đúng byte của %s', (file) => {
    const { response, next } = request(`/legal/${file}?v=1`);
    expect(response.statusCode).toBe(200);
    expect(response.end).toHaveBeenCalledWith(readFileSync(new URL(`../legal/${file}`, import.meta.url)));
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
    expect(response.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(next).not.toHaveBeenCalled();
  });

  it.each(['missing.md', 'manifest.json', 'OPERATIONS.md', '../package.json', '%2e%2e/package.json'])(
    'TC-752: chặn %s mà không fallback SPA',
    (file) => {
      const { response, next } = request(`/legal/${file}`);
      expect(response.statusCode).toBe(404);
      expect(response.end).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalled();
    },
  );

  it('TC-752: HEAD không trả nội dung và đường dẫn khác đi tiếp', () => {
    expect(request('/legal/terms.md', 'HEAD').response.end).toHaveBeenCalledWith(undefined);
    expect(request('/login').next).toHaveBeenCalledOnce();
  });

  it('TC-752: không nhận phương thức ghi vào văn bản pháp lý', () => {
    const { response } = request('/legal/terms.md', 'POST');
    expect(response.statusCode).toBe(405);
    expect(response.setHeader).toHaveBeenCalledWith('Allow', 'GET, HEAD');
  });
});
