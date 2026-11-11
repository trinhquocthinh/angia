import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import type { AppEnv } from './AppEnv.js';
import { limitRequestBody } from './limitRequestBody.js';

function fixture() {
  const app = new Hono<AppEnv>();
  let handled = 0;
  app.use('/api/*', limitRequestBody());
  app.post('/api/profiles', async (c) => {
    await c.req.json();
    handled++;
    return c.json({ saved: true }, 201);
  });
  app.post('/api/health-profiles/:id/upload-batches', (c) => c.text('multipart', 201));
  app.post('/api/health-profiles/:id/redaction-suggestions', (c) => c.text('multipart', 200));
  return { app, handled: () => handled };
}

const bodyOfSize = (size: number) => JSON.stringify({ data: 'a'.repeat(size - 11) });

describe('Giới hạn body trước validation (SEC-20261105)', () => {
  it('nhận body đúng 1 MiB; từ chối thêm một byte trước handler', async () => {
    const t = fixture();
    const send = (size: number) =>
      t.app.request('/api/profiles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: bodyOfSize(size),
      });
    expect((await send(1024 * 1024)).status).toBe(201);
    const response = await send(1024 * 1024 + 1);
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_REQUEST_TOO_LARGE' } });
    expect(t.handled()).toBe(1);
  });

  it.each([undefined, '1'])('đếm byte stream và hủy body quá lớn với Content-Length=%s', async (length) => {
    const t = fixture();
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(64 * 1024));
      },
      cancel() {
        cancelled = true;
      },
    });
    const headers = new Headers({ 'content-type': 'application/json' });
    if (length) headers.set('content-length', length);
    const request = new Request('http://localhost/api/profiles', {
      method: 'POST',
      headers,
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
    expect((await t.app.request(request)).status).toBe(413);
    expect(t.handled()).toBe(0);
    expect(cancelled).toBe(true);
  });

  it('route upload dùng giới hạn multipart riêng, không chặn lô lớn hơn 1 MiB', async () => {
    const t = fixture();
    const response = await t.app.request('/api/health-profiles/p/upload-batches', {
      method: 'POST',
      body: new Uint8Array(2 * 1024 * 1024),
    });
    expect(response.status).toBe(201);
  });

  it('route gợi ý vùng che (SPEC-083) cũng dùng bộ đọc multipart riêng, nhận ảnh lớn hơn 1 MiB', async () => {
    const t = fixture();
    const response = await t.app.request('/api/health-profiles/p/redaction-suggestions', {
      method: 'POST',
      body: new Uint8Array(2 * 1024 * 1024),
    });
    expect(response.status).toBe(200);
  });
});
