import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { spoolMultipartFiles } from './spoolMultipartFiles.js';

const encoder = new TextEncoder();
const head = '--x\r\nContent-Disposition: form-data; name="files"; filename="a.jpg"\r\n\r\n';
const limits = { fieldName: 'files', maxFiles: 3, maxFileBytes: 1000, maxBodyBytes: 10_000 };
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
function stalledBody() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  let began!: () => void;
  const started = new Promise<void>((r) => {
    began = r;
  });
  let sent = false;
  let cancelled = false;
  let failed = false;
  const body = new ReadableStream<Uint8Array>(
    {
      start(c) {
        controller = c;
      },
      pull(c) {
        if (!sent) {
          sent = true;
          c.enqueue(encoder.encode(head + 'partial'));
          began();
        }
      },
      cancel() {
        cancelled = true;
        return new Promise<void>(() => {});
      },
    },
    { highWaterMark: 0 },
  );
  return {
    body,
    started,
    cancelled: () => cancelled,
    finish: () => {
      if (!cancelled && !failed) controller.close();
    },
    push: () => controller.enqueue(encoder.encode('more')),
    fail: () => {
      failed = true;
      controller.error(new Error('mất kết nối'));
    },
  };
}
const request = (body: ReadableStream<Uint8Array>, signal?: AbortSignal) =>
  new Request('http://test/upload', {
    method: 'POST',
    headers: { 'content-type': 'multipart/form-data; boundary=x' },
    body,
    duplex: 'half',
    signal,
  } as RequestInit);

describe('TC-111/112: dừng body chậm hoặc ngắt kết nối và dọn tệp đang ghi', () => {
  let root: string;
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'angia-spool-timeouts-'));
    for (const key of ['TMPDIR', 'TMP', 'TEMP']) vi.stubEnv(key, root);
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  });

  it('TC-111: idle timeout trả lỗi, dọn tệp dù cancel của nguồn không resolve', async () => {
    const slow = stalledBody();
    const pending = spoolMultipartFiles(request(slow.body), {
      ...limits,
      idleTimeoutMs: 30,
      bodyTimeoutMs: 1000,
    });
    await slow.started;
    try {
      expect(await Promise.race([pending, wait(300)])).toEqual({ ok: false, code: 'ERR_UPLOAD_TIMEOUT' });
      expect(slow.cancelled()).toBe(true);
      expect(await readdir(root)).toEqual([]);
    } finally {
      slow.finish();
      await pending.catch(() => undefined);
    }
  });

  it('TC-111: body có byte nhỏ giọt vẫn bị deadline tổng', async () => {
    const slow = stalledBody();
    const pending = spoolMultipartFiles(request(slow.body), {
      ...limits,
      idleTimeoutMs: 100,
      bodyTimeoutMs: 150,
    });
    await slow.started;
    const timer = setInterval(() => {
      if (!slow.cancelled()) slow.push();
    }, 20);
    try {
      expect(await Promise.race([pending, wait(400)])).toEqual({ ok: false, code: 'ERR_UPLOAD_TIMEOUT' });
      expect(await readdir(root)).toEqual([]);
    } finally {
      clearInterval(timer);
      slow.finish();
      await pending.catch(() => undefined);
    }
  });

  it.each(['abort', 'stream-error'])('TC-112: %s giữa tệp dừng ghi, không để lại thư mục', async (kind) => {
    const slow = stalledBody();
    const abort = new AbortController();
    const pending = spoolMultipartFiles(request(slow.body, abort.signal), limits);
    await slow.started;
    if (kind === 'abort') abort.abort();
    else slow.fail();
    try {
      expect(await Promise.race([pending, wait(300)])).toEqual({ ok: false, code: 'ERR_VALIDATION' });
      expect(await readdir(root)).toEqual([]);
    } finally {
      slow.finish();
      await pending.catch(() => undefined);
    }
  });
});
