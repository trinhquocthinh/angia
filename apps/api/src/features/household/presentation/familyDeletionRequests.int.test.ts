import { familyDeletionResponseSchema } from '@angia/contracts';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const path = '/api/family/deletion-request';
const DAY = 24 * 60 * 60 * 1000;
describe('SPEC-069: yêu cầu và thu hồi xoá nhà', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  // Chủ hộ ở một mình; nhà tên "Nhà".
  async function setup() {
    const family = await t.family();
    const owner = await t.session(family);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    const request = (confirmFamilyName = 'Nhà') => t.call(owner, 'POST', path, { confirmFamilyName });
    const rows = async () =>
      (await t.owner.query('SELECT * FROM family_deletion_requests WHERE family_id=$1', [family])).rows;
    return { family, owner, request, rows };
  }
  it('TC-804: Chủ hộ một mình yêu cầu đúng tên → pending, executeAt sau 24 giờ, ghi audit', async () => {
    const f = await setup();
    const before = Date.now();
    const response = await f.request();
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = familyDeletionResponseSchema.parse(await response.json());
    expect(body.status).toBe('pending');
    expect(Date.parse(body.executeAt) - before).toBeGreaterThanOrEqual(DAY - 1000);
    expect(Date.parse(body.executeAt) - before).toBeLessThanOrEqual(DAY + 10_000);
    expect(await f.rows()).toMatchObject([
      { id: body.id, status: 'pending', requested_by: f.owner.accountId },
    ]);
    expect(
      (
        await t.owner.query('SELECT action,actor_account_id FROM admin_audit_events WHERE family_id=$1', [
          f.family,
        ])
      ).rows,
    ).toEqual([{ action: 'family_deletion_requested', actor_account_id: f.owner.accountId }]);
  });
  it('TC-802: nhà còn tài khoản khác → ERR_FAMILY_NOT_EMPTY, không tạo yêu cầu', async () => {
    const f = await setup();
    await t.session(f.family, 'member');
    const response = await f.request();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_FAMILY_NOT_EMPTY' } });
    expect(await f.rows()).toEqual([]);
  });
  it('TC-803: vừa gỡ người 3 ngày trước → ERR_RECENT_REMOVAL kèm thời điểm được phép; đủ 7 ngày thì qua', async () => {
    const f = await setup();
    const removedAt = new Date(Date.now() - 3 * DAY);
    await t.owner.query('UPDATE families SET last_member_removed_at=$1 WHERE id=$2', [removedAt, f.family]);
    const response = await f.request();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'ERR_RECENT_REMOVAL',
        details: { allowedAt: new Date(removedAt.getTime() + 7 * DAY).toISOString() },
      },
    });
    expect(await f.rows()).toEqual([]);
    await t.owner.query('UPDATE families SET last_member_removed_at=$1 WHERE id=$2', [
      new Date(Date.now() - 7 * DAY - 1000),
      f.family,
    ]);
    expect((await f.request()).status).toBe(201);
  });
  it('TC-802: sai tên nhà → ERR_VALIDATION; đã pending → ERR_DELETION_PENDING', async () => {
    const f = await setup();
    const wrong = await f.request('Nhà khác');
    expect(wrong.status).toBe(422);
    expect(await wrong.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    expect(await f.rows()).toEqual([]);
    expect((await f.request()).status).toBe(201);
    const again = await f.request();
    expect(again.status).toBe(409);
    expect(await again.json()).toMatchObject({ error: { code: 'ERR_DELETION_PENDING' } });
    expect(await f.rows()).toHaveLength(1);
  });
  it('TC-804: hai yêu cầu đồng thời chỉ một pending', async () => {
    const f = await setup();
    const responses = await Promise.all([f.request(), f.request()]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await f.rows()).toHaveLength(1);
  });
  it('TC-805: thu hồi trước hạn → revoked, dữ liệu còn nguyên, ghi audit, yêu cầu mới được phép', async () => {
    const f = await setup();
    const { id } = familyDeletionResponseSchema.parse(await (await f.request()).json());
    const response = await t.call(f.owner, 'DELETE', path, { requestId: id });
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await f.rows()).toMatchObject([{ id, status: 'revoked', revoked_at: expect.any(Date) }]);
    expect((await t.owner.query('SELECT 1 FROM families WHERE id=$1', [f.family])).rowCount).toBe(1);
    expect(
      (
        await t.owner.query('SELECT action FROM admin_audit_events WHERE family_id=$1 ORDER BY occurred_at', [
          f.family,
        ])
      ).rows.map((r) => r.action),
    ).toEqual(['family_deletion_requested', 'family_deletion_revoked']);
    expect((await t.call(f.owner, 'DELETE', path, { requestId: id })).status).toBe(404);
    expect((await f.request()).status).toBe(201);
  });
  it('TC-805: quá executeAt thì không thu hồi được nữa', async () => {
    const f = await setup();
    const { id } = familyDeletionResponseSchema.parse(await (await f.request()).json());
    await t.owner.query(
      "UPDATE family_deletion_requests SET created_at=now()-interval '2 days',execute_at=now()-interval '1 minute' WHERE id=$1",
      [id],
    );
    expect((await t.call(f.owner, 'DELETE', path, { requestId: id })).status).toBe(404);
    expect(await f.rows()).toMatchObject([{ status: 'pending' }]);
  });
  it('TC-808: Đồng quản lý và Thành viên không yêu cầu hay thu hồi được (ERR_FORBIDDEN)', async () => {
    const f = await setup();
    const coManager = await t.session(f.family, 'main');
    const member = await t.session(f.family, 'member');
    for (const user of [coManager, member])
      expect((await t.call(user, 'POST', path, { confirmFamilyName: 'Nhà' })).status).toBe(403);
    expect(await f.rows()).toEqual([]);
    const g = await setup();
    const { id } = familyDeletionResponseSchema.parse(await (await g.request()).json());
    const other = await t.session(g.family, 'main');
    expect((await t.call(other, 'DELETE', path, { requestId: id })).status).toBe(403);
    expect(await g.rows()).toMatchObject([{ status: 'pending' }]);
  });
  it('TC-802: không lộ yêu cầu của nhà khác; ID lạ giống ID thật của nhà khác', async () => {
    const f = await setup();
    const other = await setup();
    const { id } = familyDeletionResponseSchema.parse(await (await f.request()).json());
    await expectCrossFamilyDenied(
      () => t.call(other.owner, 'DELETE', path, { requestId: id }),
      () => t.call(other.owner, 'DELETE', path, { requestId: randomUUID() }),
    );
    expect(await f.rows()).toMatchObject([{ status: 'pending' }]);
  });
  it('TC-804: từ chối body thừa, UUID sai, không phiên và thiếu CSRF', async () => {
    const f = await setup();
    expect(
      (await t.call(f.owner, 'POST', path, { confirmFamilyName: 'Nhà', familyId: f.family })).status,
    ).toBe(422);
    expect((await t.call(f.owner, 'POST', path, {})).status).toBe(422);
    expect((await t.call(f.owner, 'DELETE', path, { requestId: 'sai' })).status).toBe(422);
    expect((await t.app.request(path, { method: 'POST' })).status).toBe(401);
    expect(
      (
        await t.app.request(path, {
          method: 'POST',
          headers: { cookie: f.owner.cookie, 'content-type': 'application/json' },
          body: JSON.stringify({ confirmFamilyName: 'Nhà' }),
        })
      ).status,
    ).toBe(403);
    expect(await f.rows()).toEqual([]);
  });
});
