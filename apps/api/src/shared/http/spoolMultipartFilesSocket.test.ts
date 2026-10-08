import { request } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { spoolMultipartFiles } from './spoolMultipartFiles.js';

let root: string;
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'angia-spool-socket-'));
  for (const key of ['TMPDIR', 'TMP', 'TEMP']) vi.stubEnv(key, root);
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

it('TC-111: timeout body chưa hoàn tất trả HTTP 408 qua adapter Node thật', async () => {
  const app = new Hono();
  app.post('/upload', async (c) => {
    const result = await spoolMultipartFiles(c.req.raw, {
      fieldName: 'files',
      maxFiles: 3,
      maxFileBytes: 1000,
      maxBodyBytes: 10000,
      idleTimeoutMs: 40,
      bodyTimeoutMs: 300,
    });
    return c.json(result, result.ok ? 201 : 408);
  });
  const server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' });
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('no address');
  try {
    const status = await new Promise<number | string>((resolve) => {
      const outgoing = request(
        {
          hostname: '127.0.0.1',
          port: address.port,
          path: '/upload',
          method: 'POST',
          headers: { 'content-type': 'multipart/form-data; boundary=x' },
        },
        (response) => {
          clearTimeout(deadline);
          response.resume();
          resolve(response.statusCode!);
          outgoing.destroy();
        },
      );
      const deadline = setTimeout(() => outgoing.destroy(new Error('HTTP test timeout')), 2000);
      outgoing.on('error', (error: NodeJS.ErrnoException) => {
        clearTimeout(deadline);
        resolve(error.code ?? error.message);
      });
      outgoing.write('--x\r\nContent-Disposition: form-data; name="files"; filename="a.jpg"\r\n\r\npartial');
    });
    expect(status).toBe(408);
  } finally {
    if ('closeAllConnections' in server) server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  }
});
