import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { householdInvitationFixture } from '@src/shared/test/householdInvitationFixture.js';

const path = '/api/invitations/inspect';
const origin = 'http://localhost:5173';
let t: ProfileTestApp;
let f: ReturnType<typeof householdInvitationFixture>;
let count = 0;
const inspect = (body: unknown, requestOrigin = origin) =>
  t.app.request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: requestOrigin },
    body: JSON.stringify(body),
  });
const unknownToken = () => randomBytes(32).toString('base64url');

beforeAll(async () => {
  t = await startProfileTestApp(origin, {
    accountRateLimit: {
      store: { increment: async () => ++count, read: async () => count },
      keyHasher: (kind, key) => `${kind}:${key}`,
      now: () => 0,
    },
  });
  f = householdInvitationFixture(t);
});
beforeEach(() => {
  count = 0;
});
afterAll(async () => {
  await t?.stop();
});

describe('SPEC-065: kiểm tra lời mời không cần phiên', () => {
  it.each(['member', 'main'])('SPEC-065: join %s chỉ trả loại/vai trò, không tiêu lời mời', async (role) => {
    const invite = await f.issue(role);
    const before = await t.owner.query('SELECT * FROM family_invitations WHERE id=$1', [invite.invitationId]);
    const audits = await t.owner.query('SELECT * FROM admin_audit_events ORDER BY id');
    const response = await inspect({ token: invite.token });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ kind: 'join_family', role });
    expect(
      (await t.owner.query('SELECT * FROM family_invitations WHERE id=$1', [invite.invitationId])).rows,
    ).toEqual(before.rows);
    expect((await t.owner.query('SELECT * FROM admin_audit_events ORDER BY id')).rows).toEqual(audits.rows);
    expect(await f.state(invite.invitationId)).toMatchObject({ accepted_at: null, revoked_at: null });
    expect((await f.accept(await f.waiting(), invite.token)).status).toBe(204);
  });
  it('SPEC-065: found chỉ trả loại và giữ nguyên trạng thái', async () => {
    const result = await t.call(await f.waiting(true), 'POST', '/api/admin/founding-invitations', {
      kind: 'found_family',
    });
    expect(result.status).toBe(201);
    const invite = (await result.json()) as { link: string; invitationId: string };
    const token = new URLSearchParams(new URL(invite.link).hash.slice(1)).get('token');
    const before = await f.state(invite.invitationId);
    const response = await inspect({ token });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ kind: 'found_family' });
    expect(await f.state(invite.invitationId)).toEqual(before);
  });
  it.each(['đã dùng', 'hết hạn', 'thu hồi'])('SPEC-065: found %s trả cùng lỗi 404', async (state) => {
    const admin = await f.waiting(true);
    const issued = await t.call(admin, 'POST', '/api/admin/founding-invitations', { kind: 'found_family' });
    expect(issued.status).toBe(201);
    const invite = (await issued.json()) as { link: string; invitationId: string };
    const token = new URLSearchParams(new URL(invite.link).hash.slice(1)).get('token');
    if (state === 'đã dùng')
      expect(
        (
          await t.call(await f.waiting(), 'POST', '/api/families', {
            name: 'Nhà mới',
            invitationToken: token,
          })
        ).status,
      ).toBe(201);
    if (state === 'hết hạn')
      await t.owner.query(
        "UPDATE family_invitations SET created_at=now()-interval '8 days',expires_at=now()-interval '1 day' WHERE id=$1",
        [invite.invitationId],
      );
    if (state === 'thu hồi')
      expect(
        (await t.call(admin, 'DELETE', `/api/admin/founding-invitations/${invite.invitationId}`)).status,
      ).toBe(204);
    const response = await inspect({ token });
    const missing = await inspect({ token: unknownToken() });
    expect(response.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await response.json()).toEqual(await missing.json());
  });
  it.each(['đã dùng', 'hết hạn', 'thu hồi', 'sai'])('SPEC-065: join %s có cùng body 404', async (state) => {
    const invite = await f.issue();
    if (state === 'đã dùng') expect((await f.accept(await f.waiting(), invite.token)).status).toBe(204);
    if (state === 'hết hạn')
      await t.owner.query(
        "UPDATE family_invitations SET created_at=now()-interval '8 days',expires_at=now()-interval '1 day' WHERE id=$1",
        [invite.invitationId],
      );
    if (state === 'thu hồi')
      expect(
        (await t.call(invite.creator, 'DELETE', `/api/family/invitations/${invite.invitationId}`)).status,
      ).toBe(204);
    const response = await inspect({ token: state === 'sai' ? unknownToken() : invite.token });
    const missing = await inspect({ token: unknownToken() });
    expect(response.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(await response.clone().json()).toEqual(await missing.json());
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it.each([{}, { token: 'abcdef123456' }, { token: 'A'.repeat(43), familyId: 'bí mật' }])(
    'SPEC-065: body sai trả 422 %j',
    async (body) => {
      const response = await inspect(body);
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
      expect(response.headers.get('cache-control')).toBe('no-store');
    },
  );
  it('SPEC-065: chặn Origin lạ trước khi tiêu giới hạn', async () => {
    const response = await inspect({ token: unknownToken() }, 'https://evil.test');
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(count).toBe(0);
  });
  it('SPEC-065: IP vượt 30 lượt bị chặn trong một giờ', async () => {
    for (let i = 0; i < 30; i++) expect((await inspect({ token: unknownToken() })).status).toBe(404);
    const response = await inspect({ token: unknownToken() });
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_RATE_LIMITED' } });
    expect(response.headers.get('retry-after')).toBe('3600');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
