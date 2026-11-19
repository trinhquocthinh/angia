import { ownershipOfferResponseSchema } from '@angia/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { createHouseholdOwnershipRepository } from '../infrastructure/createHouseholdOwnershipRepository.js';

const base = '/api/family/ownership-offers';
describe('SPEC-068: nguyên tử và quyền hiện hành', () => {
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
    const response = await t.call(owner, 'POST', base, { targetAccountId: target.accountId });
    expect(response.status).toBe(201);
    const { id } = ownershipOfferResponseSchema.parse(await response.json());
    return { family, owner, target, id };
  }
  it('TC-797: audit lỗi rollback cả Chủ hộ và trạng thái đề nghị', async () => {
    const f = await setup();
    await t.owner.query(`CREATE FUNCTION reject_ownership_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action='ownership_transfer_accepted' THEN RAISE EXCEPTION 'Lỗi nhật ký thử'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_ownership_audit BEFORE INSERT ON admin_audit_events FOR EACH ROW EXECUTE FUNCTION reject_ownership_audit()`);
    try {
      expect((await t.call(f.target, 'POST', `${base}/${f.id}/decision`, { accept: true })).status).toBe(500);
      expect(
        (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [f.family])).rows[0]
          .owner_account_id,
      ).toBe(f.owner.accountId);
      expect(
        (await t.owner.query('SELECT status,decided_at FROM ownership_transfer_offers WHERE id=$1', [f.id]))
          .rows[0],
      ).toEqual({ status: 'pending', decided_at: null });
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_ownership_audit ON admin_audit_events; DROP FUNCTION reject_ownership_audit()',
      );
    }
  });
  it('TC-798: chấp nhận và thu hồi đồng thời chỉ có một kết quả thắng', async () => {
    const f = await setup();
    const responses = await Promise.all([
      t.call(f.target, 'POST', `${base}/${f.id}/decision`, { accept: true }),
      t.call(f.owner, 'DELETE', `${base}/${f.id}`),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([204, 404]);
    const status = (await t.owner.query('SELECT status FROM ownership_transfer_offers WHERE id=$1', [f.id]))
      .rows[0].status;
    expect(
      (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [f.family])).rows[0]
        .owner_account_id,
    ).toBe(status === 'accepted' ? f.target.accountId : f.owner.accountId);
    expect(
      (
        await t.owner.query(
          "SELECT * FROM admin_audit_events WHERE family_id=$1 AND action IN ('ownership_transfer_accepted','ownership_transfer_revoked')",
          [f.family],
        )
      ).rowCount,
    ).toBe(1);
  });
  it('TC-801: chấp nhận đua với hạ vai trò vẫn giữ Chủ hộ là main', async () => {
    const f = await setup();
    const responses = await Promise.all([
      t.call(f.target, 'POST', `${base}/${f.id}/decision`, { accept: true }),
      t.call(f.owner, 'PATCH', `/api/family/members/${f.target.accountId}`, {
        action: 'change_role',
        role: 'member',
      }),
    ]);
    const statuses = responses.map((r) => r.status);
    expect([
      [204, 403],
      [404, 204],
      [403, 204],
    ]).toContainEqual(statuses);
    const row = (
      await t.owner.query(
        'SELECT a.id,a.family_id,a.family_role FROM families f JOIN accounts a ON a.id=f.owner_account_id WHERE f.id=$1',
        [f.family],
      )
    ).rows[0];
    expect(row).toMatchObject({ family_id: f.family, family_role: 'main' });
    expect(
      (
        await t.owner.query(
          "SELECT * FROM ownership_transfer_offers WHERE family_id=$1 AND status='pending'",
          [f.family],
        )
      ).rowCount,
    ).toBe(0);
  });
  it('TC-799: kho kiểm lại DB thay vì tin actor main từ phiên cũ', async () => {
    const f = await setup();
    const repository = createHouseholdOwnershipRepository(t.database);
    const actor = { accountId: f.target.accountId, familyId: f.family, role: 'main' as const };
    await t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [f.target.accountId]);
    expect(await repository.decide(actor, f.id, true)).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
    expect(await repository.offer(actor, f.owner.accountId)).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
    expect(await repository.revoke(actor, f.id)).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
    await t.owner.query('UPDATE accounts SET locked_at=now() WHERE id=$1', [f.target.accountId]);
    expect(await repository.decide(actor, f.id, true)).toEqual({ ok: false, code: 'ERR_UNAUTHENTICATED' });
  });
  it('TC-801: quyền Chủ hộ đổi ngoài luồng làm đề nghị cũ hết hiệu lực', async () => {
    const f = await setup();
    const other = await t.session(f.family);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [other.accountId, f.family]);
    expect((await t.call(f.target, 'POST', `${base}/${f.id}/decision`, { accept: true })).status).toBe(422);
    expect(
      (await t.owner.query('SELECT status FROM ownership_transfer_offers WHERE id=$1', [f.id])).rows[0]
        .status,
    ).toBe('revoked');
    expect(
      (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [f.family])).rows[0]
        .owner_account_id,
    ).toBe(other.accountId);
  });
  it('TC-801: audit thu hồi lỗi rollback cả thao tác hạ vai trò', async () => {
    const f = await setup();
    await t.owner.query(`CREATE FUNCTION reject_ownership_revoke() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action='ownership_transfer_revoked' THEN RAISE EXCEPTION 'Lỗi nhật ký thử'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_ownership_revoke BEFORE INSERT ON admin_audit_events FOR EACH ROW EXECUTE FUNCTION reject_ownership_revoke()`);
    try {
      expect(
        (
          await t.call(f.owner, 'PATCH', `/api/family/members/${f.target.accountId}`, {
            action: 'change_role',
            role: 'member',
          })
        ).status,
      ).toBe(500);
      expect(
        (await t.owner.query('SELECT family_role FROM accounts WHERE id=$1', [f.target.accountId])).rows[0]
          .family_role,
      ).toBe('main');
      expect(
        (await t.owner.query('SELECT status FROM ownership_transfer_offers WHERE id=$1', [f.id])).rows[0]
          .status,
      ).toBe('pending');
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_ownership_revoke ON admin_audit_events; DROP FUNCTION reject_ownership_revoke()',
      );
    }
  });
});
