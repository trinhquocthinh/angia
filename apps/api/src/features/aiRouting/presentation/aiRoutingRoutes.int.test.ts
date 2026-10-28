import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_AI_ROUTING_SETTINGS,
  aiRoutingViewSchema,
  type UpdateAiRoutingRequest,
} from '@angia/contracts';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';

const PATH = '/api/admin/ai-routing';
const request = (expectedVersion = 0): UpdateAiRoutingRequest => ({
  expectedVersion,
  settings: structuredClone(DEFAULT_AI_ROUTING_SETTINGS) as UpdateAiRoutingRequest['settings'],
});
const swapped = {
  primaryModel: 'moonshotai/kimi-k2.6',
  fallbackModel: 'google/gemini-3.1-flash-lite',
} as const;

describe('API cấu hình nhà cung cấp OCR trong Admin', () => {
  let t: AdminTestApp;
  const auditCount = async () =>
    Number((await t.owner.query('SELECT count(*) AS n FROM ai_routing_audit')).rows[0].n);
  const read = async () => aiRoutingViewSchema.parse(await (await t.call(t.admin, 'GET', PATH)).json());

  beforeAll(async () => {
    t = await startAdminTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  beforeEach(async () => {
    await t.owner.query('DELETE FROM ai_routing_audit');
    await t.owner.query(
      'UPDATE ai_routing_settings SET version = 0, settings = $1::jsonb, updated_at = NULL, updated_by = NULL WHERE id = 1',
      [JSON.stringify(DEFAULT_AI_ROUTING_SETTINGS)],
    );
  });

  it('TC-458: GET chỉ đọc bootstrap OpenRouter, không ghi audit và không có secret', async () => {
    const response = await t.call(t.admin, 'GET', PATH);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      version: 0,
      settings: DEFAULT_AI_ROUTING_SETTINGS,
      updatedAt: null,
      updatedBy: null,
    });
    expect(await auditCount()).toBe(0);
  });

  it('TC-459: PUT lưu cấu hình và audit cùng version, actor từ phiên, timestamp phía server', async () => {
    const response = await t.call(t.admin, 'PUT', PATH, request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const saved = aiRoutingViewSchema.parse(await response.json());
    expect(saved).toMatchObject({ version: 1, settings: request().settings, updatedBy: t.admin.accountId });
    expect(new Date(saved.updatedAt ?? '').getTime()).toBeGreaterThan(0);
    expect(await read()).toEqual(saved);
    const { rows } = await t.owner.query(
      'SELECT version, settings, updated_by, updated_at FROM ai_routing_audit',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].settings).toEqual(saved.settings);
    expect(rows[0].updated_by).toBe(t.admin.accountId);
    expect(rows[0].updated_at.toISOString()).toBe(saved.updatedAt);
  });

  it('TC-460: version cũ bị 409, không thay cấu hình hoặc tạo thêm audit', async () => {
    expect((await t.call(t.admin, 'PUT', PATH, request())).status).toBe(200);
    const saved = await read();
    const response = await t.call(t.admin, 'PUT', PATH, request());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_AI_ROUTING_CONFLICT' } });
    expect(await read()).toEqual(saved);
    expect(await auditCount()).toBe(1);
  });

  it('TC-461: hai PUT đồng thời chỉ một thành công, audit và cấu hình cùng phiên bản', async () => {
    const a = request();
    const b = request();
    b.settings.openrouter = swapped;
    const responses = await Promise.all([t.call(t.admin, 'PUT', PATH, a), t.call(t.admin, 'PUT', PATH, b)]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    const winner = responses.find((r) => r.status === 200);
    expect(await read()).toEqual(await winner?.json());
    expect(await auditCount()).toBe(1);
  });

  it('TC-462: đổi cặp model OpenRouter rồi đổi lại, mỗi lần một version và một audit', async () => {
    const first = aiRoutingViewSchema.parse(await (await t.call(t.admin, 'PUT', PATH, request())).json());
    const next = { expectedVersion: first.version, settings: { openrouter: swapped } };
    const second = aiRoutingViewSchema.parse(await (await t.call(t.admin, 'PUT', PATH, next)).json());
    expect(second.settings.openrouter).toEqual(swapped);
    const third = aiRoutingViewSchema.parse(
      await (
        await t.call(t.admin, 'PUT', PATH, { expectedVersion: second.version, settings: first.settings })
      ).json(),
    );
    expect(third.version).toBe(3);
    expect(third.settings).toEqual(first.settings);
    expect(await auditCount()).toBe(3);
  });

  it('TC-463: ghi audit lỗi thì rollback cả cấu hình, không trả thành công giả', async () => {
    await t.owner.query(
      'INSERT INTO ai_routing_audit (version, settings, updated_at, updated_by) VALUES (1, $1::jsonb, now(), $2)',
      [JSON.stringify(request().settings), t.admin.accountId],
    );
    const response = await t.call(t.admin, 'PUT', PATH, request());
    expect(response.status).toBe(500);
    expect((await read()).version).toBe(0);
    expect(await auditCount()).toBe(1);
  });

  it('TC-464: không có phiên bị 401 ở cả GET và PUT', async () => {
    for (const method of ['GET', 'PUT']) {
      const r = await t.app.request(PATH, { method });
      expect(r.status).toBe(401);
    }
    expect(await auditCount()).toBe(0);
  });

  it('TC-465: main/member ở hai gia đình đều không được đọc hoặc đổi cấu hình toàn hệ thống', async () => {
    for (const familyRole of ['main', 'member'] as const) {
      const familyId = await t.seedFamily();
      const user = await seedSession(t.owner, await seedAccount(t.owner, { familyId, familyRole }));
      for (const method of ['GET', 'PUT'])
        expect((await t.call(user, method, PATH, method === 'PUT' ? request() : undefined)).status).toBe(403);
    }
    expect(await auditCount()).toBe(0);
  });

  it('TC-466: PUT thiếu/sai CSRF bị 403 và không ghi dữ liệu', async () => {
    for (const token of [undefined, 'wrong']) {
      const response = await t.app.request(PATH, {
        method: 'PUT',
        headers: {
          cookie: t.admin.cookie,
          'content-type': 'application/json',
          ...(token ? { 'x-csrf-token': token } : {}),
        },
        body: JSON.stringify(request()),
      });
      expect(response.status).toBe(403);
    }
    expect((await read()).version).toBe(0);
  });

  it('TC-467, TC-647: PUT chặn key/URL/actor giả, hệ số và khóa Woku cũ, giữ nguyên DB', async () => {
    const body = request();
    const models = body.settings.openrouter;
    const invalid = [
      { ...body, apiKey: 'synthetic-secret' },
      { ...body, updatedBy: t.admin.accountId },
      { ...body, settings: { openrouter: { ...models, baseUrl: 'https://example.invalid' } } },
      { ...body, settings: { openrouter: { ...models, usdPerCredit: '1' } } },
      { ...body, settings: { ...body.settings, selectedProvider: 'openrouter' } },
      {
        ...body,
        settings: {
          ...body.settings,
          woku: { primaryModel: 'gemini-3-flash-preview', fallbackModel: 'gemini-3.8-flash' },
        },
      },
    ];
    for (const input of invalid) expect((await t.call(t.admin, 'PUT', PATH, input)).status).toBe(422);
    expect((await read()).version).toBe(0);
    expect(await auditCount()).toBe(0);
  });
});
