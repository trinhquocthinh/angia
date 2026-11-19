import { ownershipOfferResponseSchema } from '@angia/contracts';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const base = '/api/family/ownership-offers';
describe('SPEC-068: trao quyền Chủ hộ', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  async function setup() {
    const family = await t.family();
    const owner = await t.session(family);
    const target = await t.session(family);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    const offer = () => t.call(owner, 'POST', base, { targetAccountId: target.accountId });
    return { family, owner, target, offer };
  }
  it('TC-797: chỉ đổi Chủ hộ sau chấp nhận, giữ cả hai main và ghi audit', async () => {
    const f = await setup();
    const response = await f.offer();
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const offer = ownershipOfferResponseSchema.parse(await response.json());
    expect(offer).toMatchObject({
      id: expect.any(String),
      status: 'pending',
      targetAccountId: f.target.accountId,
    });
    expect(
      (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [f.family])).rows[0]
        .owner_account_id,
    ).toBe(f.owner.accountId);
    const decision = await t.call(f.target, 'POST', `${base}/${offer.id}/decision`, { accept: true });
    expect(decision.status).toBe(204);
    expect(decision.headers.get('cache-control')).toBe('no-store');
    expect(
      (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [f.family])).rows[0]
        .owner_account_id,
    ).toBe(f.target.accountId);
    expect(
      (await t.owner.query('SELECT family_role FROM accounts WHERE family_id=$1', [f.family])).rows,
    ).toEqual([{ family_role: 'main' }, { family_role: 'main' }]);
    expect(
      (await t.owner.query('SELECT status,decided_at FROM ownership_transfer_offers WHERE id=$1', [offer.id]))
        .rows[0],
    ).toEqual({ status: 'accepted', decided_at: expect.any(Date) });
    expect(
      (
        await t.owner.query('SELECT action FROM admin_audit_events WHERE family_id=$1 ORDER BY occurred_at', [
          f.family,
        ])
      ).rows.map((r) => r.action),
    ).toEqual(['ownership_transfer_offered', 'ownership_transfer_accepted']);
    expect((await t.call(f.target, 'POST', `${base}/${offer.id}/decision`, { accept: true })).status).toBe(
      404,
    );
  });
  it('TC-798: từ chối hoặc thu hồi không đổi Chủ hộ và cho phép đề nghị mới', async () => {
    const f = await setup();
    for (const action of ['declined', 'revoked']) {
      const { id } = ownershipOfferResponseSchema.parse(await (await f.offer()).json());
      const response =
        action === 'declined'
          ? await t.call(f.target, 'POST', `${base}/${id}/decision`, { accept: false })
          : await t.call(f.owner, 'DELETE', `${base}/${id}`);
      expect(response.status).toBe(204);
      expect(
        (await t.owner.query('SELECT status FROM ownership_transfer_offers WHERE id=$1', [id])).rows[0]
          .status,
      ).toBe(action);
    }
    expect(
      (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [f.family])).rows[0]
        .owner_account_id,
    ).toBe(f.owner.accountId);
  });
  it('TC-799: chỉ Chủ hộ đề nghị cho Đồng quản lý khác trong nhà', async () => {
    const f = await setup();
    const member = await t.session(f.family, 'member');
    for (const targetAccountId of [member.accountId, f.owner.accountId])
      expect((await t.call(f.owner, 'POST', base, { targetAccountId })).status).toBe(422);
    expect((await t.call(f.target, 'POST', base, { targetAccountId: f.owner.accountId })).status).toBe(403);
    expect((await t.call(member, 'POST', base, { targetAccountId: f.target.accountId })).status).toBe(403);
  });
  it('TC-800: tối đa một pending kể cả hai đề nghị đồng thời', async () => {
    const f = await setup();
    const responses = await Promise.all([f.offer(), f.offer()]);
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await responses.find((r) => r.status === 409)!.json()).toMatchObject({
      error: { code: 'ERR_OWNERSHIP_TRANSFER_PENDING' },
    });
  });
  it('TC-801: hạ vai trò thu hồi đề nghị, nâng lại cũng không làm đề nghị sống lại', async () => {
    const f = await setup();
    const { id } = ownershipOfferResponseSchema.parse(await (await f.offer()).json());
    for (const role of ['member', 'main'])
      expect(
        (
          await t.call(f.owner, 'PATCH', `/api/family/members/${f.target.accountId}`, {
            action: 'change_role',
            role,
          })
        ).status,
      ).toBe(204);
    expect((await t.call(f.target, 'POST', `${base}/${id}/decision`, { accept: true })).status).toBe(404);
    expect(
      (await t.owner.query('SELECT status FROM ownership_transfer_offers WHERE id=$1', [id])).rows[0].status,
    ).toBe('revoked');
    expect((await f.offer()).status).toBe(201);
  });
  it('TC-801: gỡ hoặc tự rời nhà thu hồi đề nghị cùng transaction', async () => {
    for (const action of ['remove', 'leave']) {
      const f = await setup();
      const { id } = ownershipOfferResponseSchema.parse(await (await f.offer()).json());
      const response =
        action === 'remove'
          ? await t.call(f.owner, 'PATCH', `/api/family/members/${f.target.accountId}`, { action: 'remove' })
          : await t.call(f.target, 'POST', '/api/family/leave', {});
      expect(response.status).toBe(204);
      expect(
        (await t.owner.query('SELECT status,decided_at FROM ownership_transfer_offers WHERE id=$1', [id]))
          .rows[0],
      ).toEqual({ status: 'revoked', decided_at: expect.any(Date) });
      expect(
        (
          await t.owner.query(
            "SELECT actor_account_id FROM admin_audit_events WHERE family_id=$1 AND action='ownership_transfer_revoked'",
            [f.family],
          )
        ).rows[0].actor_account_id,
      ).toBe(action === 'remove' ? f.owner.accountId : f.target.accountId);
    }
  });
  it('TC-797: không lộ đề nghị hoặc tài khoản khác nhà; chỉ người nhận trả lời, người gửi thu hồi', async () => {
    const f = await setup();
    const other = await setup();
    const { id } = ownershipOfferResponseSchema.parse(await (await f.offer()).json());
    for (const [method, suffix, body] of [
      ['POST', '/decision', { accept: true }],
      ['DELETE', '', undefined],
    ] as const)
      await expectCrossFamilyDenied(
        () => t.call(other.owner, method, `${base}/${id}${suffix}`, body),
        () => t.call(other.owner, method, `${base}/${randomUUID()}${suffix}`, body),
      );
    await expectCrossFamilyDenied(
      () => t.call(f.owner, 'POST', base, { targetAccountId: other.target.accountId }),
      () => t.call(f.owner, 'POST', base, { targetAccountId: randomUUID() }),
    );
    expect((await t.call(f.owner, 'POST', `${base}/${id}/decision`, { accept: true })).status).toBe(403);
    expect((await t.call(f.target, 'DELETE', `${base}/${id}`)).status).toBe(403);
  });
  it('TC-797: từ chối body thừa, UUID sai, không phiên và thiếu CSRF', async () => {
    const f = await setup();
    expect(
      (await t.call(f.owner, 'POST', base, { targetAccountId: f.target.accountId, accept: true })).status,
    ).toBe(422);
    expect((await t.call(f.target, 'POST', `${base}/invalid/decision`, { accept: true })).status).toBe(422);
    expect(
      (await t.call(f.target, 'POST', `${base}/${randomUUID()}/decision`, { accept: 'true' })).status,
    ).toBe(422);
    expect((await t.app.request(base, { method: 'POST' })).status).toBe(401);
    expect(
      (
        await t.app.request(base, {
          method: 'POST',
          headers: { cookie: f.owner.cookie, 'content-type': 'application/json' },
          body: JSON.stringify({ targetAccountId: f.target.accountId }),
        })
      ).status,
    ).toBe(403);
  });
});
