import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { OpenAPIHono } from '@hono/zod-openapi';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SessionContext } from '@src/shared/auth/domain/SessionContext.js';
import type { AppEnv } from '@src/shared/http/AppEnv.js';
import { createMemoryDocumentDeps } from '@src/shared/test/createMemoryDocumentDeps.js';
import { registerDocumentRoutes } from './registerDocumentRoutes.js';

const profileId = randomUUID();
const pendingId = randomUUID();
const otherId = randomUUID();
const profiles = [
  { id: profileId, familyId: 'family-a', consentStatus: 'confirmed' as const },
  { id: pendingId, familyId: 'family-a', consentStatus: 'pending' as const },
  { id: otherId, familyId: 'family-b', consentStatus: 'confirmed' as const },
];
const session: SessionContext = {
  sessionId: 'session-a',
  csrfToken: 'csrf',
  expiresAt: new Date('2030-01-01'),
  account: { id: 'account-a', displayName: 'Người chăm', isSystemAdmin: false, healthProfileId: null },
  family: { id: 'family-a', name: 'Nhà' },
  role: 'main',
};
const setup = () => {
  const targets = profiles.map((p) => ({
    ...p,
    consentStatus: p.consentStatus as 'pending' | 'invited' | 'declined' | 'confirmed',
  }));
  const memory = createMemoryDocumentDeps(targets);
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', async (c, next) => {
    c.set('session', session);
    await next();
  });
  registerDocumentRoutes(app, memory.deps);
  return { app, memory, targets };
};
const slowBody = () => {
  let finish!: () => void;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      finish = () => {
        if (!body.locked) return;
        controller.enqueue(
          new TextEncoder().encode(
            '--x\r\nContent-Disposition: form-data; name="files"; filename="a.jpg"\r\n\r\n',
          ),
        );
        controller.enqueue(new Uint8Array([255, 216, 255, 224]));
        controller.enqueue(new TextEncoder().encode('\r\n--x--\r\n'));
        controller.close();
      };
    },
  });
  return { body, finish };
};
const send = (app: OpenAPIHono<AppEnv>, id: string, body: ReadableStream<Uint8Array>, signal?: AbortSignal) =>
  app.request(`/api/health-profiles/${id}/upload-batches`, {
    method: 'POST',
    headers: { 'content-type': 'multipart/form-data; boundary=x' },
    body,
    signal,
    duplex: 'half',
  } as RequestInit);
const quick = (app: OpenAPIHono<AppEnv>) => {
  const form = new FormData();
  form.append('files', new File([new Uint8Array([255, 216, 255, 224])], 'a.jpg'));
  return app.request(`/api/health-profiles/${profileId}/upload-batches`, { method: 'POST', body: form });
};

describe('Bảo vệ slot nhận upload (E3-S1-T1 follow-up)', () => {
  let root: string;
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'angia-upload-preflight-'));
    for (const key of ['TMPDIR', 'TMP', 'TEMP']) vi.stubEnv(key, root);
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  });
  it.each([
    [randomUUID(), 404],
    [otherId, 404],
    [pendingId, 409],
  ])('hồ sơ %s bị từ chối %s dù body chưa gửi byte nào', async (id, status) => {
    const { app, memory } = setup();
    const slow = slowBody();
    const pending = send(app, String(id), slow.body);
    try {
      const result = await Promise.race([pending, new Promise<null>((r) => setTimeout(() => r(null), 150))]);
      expect(result?.status).toBe(status);
      expect(memory.batches).toEqual([]);
    } finally {
      slow.finish();
      await pending;
    }
  });

  it('TC-111: ba body hợp lệ treo bị timeout, nhả đủ ba slot và dọn thư mục', async () => {
    const { app } = setup();
    vi.useFakeTimers();
    const slow = Array.from({ length: 3 }, slowBody);
    const pending = slow.map((s) => send(app, profileId, s.body));
    try {
      await vi.waitFor(() => expect(slow.every((s) => s.body.locked)).toBe(true));
      expect((await quick(app)).status).toBe(503);
      await vi.advanceTimersByTimeAsync(30_001);
      const responses = await Promise.all(pending);
      expect(responses.map((r) => r.status)).toEqual([408, 408, 408]);
      expect(await responses[0]!.json()).toMatchObject({ error: { code: 'ERR_UPLOAD_TIMEOUT' } });
      expect(await readdir(root)).toEqual([]);
      expect((await quick(app)).status).toBe(201);
    } finally {
      vi.useRealTimers();
      slow.forEach((s) => s.finish());
      await Promise.all(pending);
    }
  });

  it('TC-112: abort một body đang giữ slot cho phép upload tiếp ngay', async () => {
    const { app } = setup();
    const slow = Array.from({ length: 3 }, slowBody);
    const abort = new AbortController();
    const pending = slow.map((s, i) => send(app, profileId, s.body, i === 0 ? abort.signal : undefined));
    try {
      await vi.waitFor(() => expect(slow.every((s) => s.body.locked)).toBe(true));
      expect((await quick(app)).status).toBe(503);
      abort.abort();
      expect((await pending[0]!).status).toBe(422);
      expect((await quick(app)).status).toBe(201);
    } finally {
      slow.forEach((s) => s.finish());
      await Promise.all(pending);
    }
    expect(await readdir(root)).toEqual([]);
  });

  it('TC-113: đồng thuận bị thu hồi trong lúc nhận body được kiểm lại khi ghi', async () => {
    const { app, memory, targets } = setup();
    const slow = slowBody();
    const pending = send(app, profileId, slow.body);
    await vi.waitFor(() => expect(slow.body.locked).toBe(true));
    targets[0]!.consentStatus = 'pending';
    slow.finish();
    expect((await pending).status).toBe(409);
    expect(memory.documents).toEqual([]);
    expect(memory.objects.size).toBe(0);
  });

  it('ba body chậm vào hồ sơ không tồn tại không chặn upload hợp lệ', async () => {
    const { app, memory } = setup();
    const slow = Array.from({ length: 3 }, slowBody);
    const pending = slow.map((s) => send(app, randomUUID(), s.body));
    try {
      await new Promise((r) => setTimeout(r, 40));
      expect((await quick(app)).status).toBe(201);
      expect(memory.documents).toHaveLength(1);
    } finally {
      slow.forEach((s) => s.finish());
      await Promise.all(pending);
    }
  });
});
