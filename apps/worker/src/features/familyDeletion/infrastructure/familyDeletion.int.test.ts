import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { useDeletionHarness } from './useDeletionHarness.test-helper.js';

describe('SPEC-069: execute-family-deletion trên PostgreSQL thật, role app NOBYPASSRLS', () => {
  let fx: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  beforeAll(async () => {
    fx = await createSanitizePgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  const { send, objects, run, seed } = useDeletionHarness(() => fx);
  const count = async (sql: string, params: unknown[]) =>
    Number((await fx.owner.query(sql, params)).rows[0].n);

  it('TC-806: đến hạn và chỉ còn Chủ hộ → xoá hết dữ liệu và object của nhà; Chủ hộ còn tài khoản, familyId = null; nhà khác nguyên vẹn', async () => {
    send.mockClear();
    const a = await seed();
    const b = await seed(false);
    expect(await run()).toEqual({ executed: 1, cancelled: 0, failed: 0 });
    for (const table of [
      'families',
      'health_profiles',
      'source_documents',
      'upload_batches',
      'push_subscriptions',
      'removed_member_windows',
      'family_deletion_requests',
    ])
      expect(
        await count(`SELECT count(*) n FROM ${table} WHERE ${table === 'families' ? 'id' : 'family_id'}=$1`, [
          a.familyId,
        ]),
      ).toBe(0);
    expect(
      (
        await fx.owner.query('SELECT family_id,family_role,health_profile_id FROM accounts WHERE id=$1', [
          a.accountId,
        ])
      ).rows,
    ).toEqual([{ family_id: null, family_role: null, health_profile_id: null }]);
    expect([...objects].some((key) => key.includes(a.familyId))).toBe(false);
    expect([...objects].some((key) => key.includes(b.familyId))).toBe(true);
    expect(
      (
        await fx.owner.query('SELECT object_key FROM object_purges WHERE family_id=$1 ORDER BY 1', [
          a.familyId,
        ])
      ).rows.map((row) => row.object_key),
    ).toEqual([
      `families/${a.familyId}/profiles/${a.profileId}/documents/${a.documentId}/upload.jpg`,
      `families/${a.familyId}/profiles/${a.profileId}/documents/old.jpg`,
    ]);
    expect(send).toHaveBeenCalledWith(
      'purge-pending-objects',
      { familyId: a.familyId },
      expect.objectContaining({ db: expect.anything() }),
    );
    expect(send).toHaveBeenCalledWith(
      'purge-profile-objects',
      { familyId: a.familyId, profileId: a.profileId },
      expect.objectContaining({ db: expect.anything(), startAfter: expect.any(Number) }),
    );
    expect(
      (
        await fx.owner.query(
          'SELECT action,actor_account_id,target_account_id FROM admin_audit_events WHERE family_id=$1',
          [a.familyId],
        )
      ).rows,
    ).toEqual([
      { action: 'family_deletion_executed', actor_account_id: a.accountId, target_account_id: a.accountId },
    ]);
    expect(await count('SELECT count(*) n FROM health_profiles WHERE family_id=$1', [b.familyId])).toBe(1);
    expect(
      await count("SELECT count(*) n FROM family_deletion_requests WHERE id=$1 AND status='pending'", [
        b.requestId,
      ]),
    ).toBe(1);
  });
  it('TC-807: có người vào nhà trong lúc chờ → không xoá gì, yêu cầu bị huỷ kèm lý do, audit revoked', async () => {
    const f = await seed();
    await fx.owner.query(
      `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES ($1,$2,'Khách',$3,'member')`,
      [randomUUID(), `sub-${randomUUID()}`, f.familyId],
    );
    expect(await run()).toEqual({ executed: 0, cancelled: 1, failed: 0 });
    expect(
      (
        await fx.owner.query(
          'SELECT status,cancel_reason,revoked_at FROM family_deletion_requests WHERE id=$1',
          [f.requestId],
        )
      ).rows,
    ).toEqual([{ status: 'revoked', cancel_reason: 'family_not_empty', revoked_at: expect.any(Date) }]);
    expect(await count('SELECT count(*) n FROM health_profiles WHERE family_id=$1', [f.familyId])).toBe(1);
    expect([...objects].some((key) => key.includes(f.familyId))).toBe(true);
    expect(
      (
        await fx.owner.query('SELECT action,metadata FROM admin_audit_events WHERE family_id=$1', [
          f.familyId,
        ])
      ).rows,
    ).toEqual([{ action: 'family_deletion_revoked', metadata: { reason: 'family_not_empty' } }]);
  });
  it('TC-869: yêu cầu đã thu hồi, đã huỷ hoặc chưa đến hạn không bị job đọc hay xoá', async () => {
    const future = await seed(false);
    const revoked = await seed();
    await fx.owner.query(
      "UPDATE family_deletion_requests SET status='revoked',revoked_at=now() WHERE id=$1",
      [revoked.requestId],
    );
    expect(await run()).toEqual({ executed: 0, cancelled: 0, failed: 0 });
    for (const f of [future, revoked])
      expect(await count('SELECT count(*) n FROM health_profiles WHERE family_id=$1', [f.familyId])).toBe(1);
  });
  it('TC-806: mọi bảng có family_id đều được job xử lý — bảng mới phải cập nhật bộ xoá', async () => {
    const rows = (
      await fx.owner.query(`
        WITH RECURSIVE casc(rel) AS (
          SELECT 'health_profiles'::regclass::oid
          UNION SELECT c.conrelid FROM pg_constraint c JOIN casc ON c.confrelid=casc.rel
            WHERE c.contype='f' AND c.confdeltype='c')
        SELECT t.table_name FROM information_schema.columns t
        WHERE t.table_schema='public' AND t.column_name='family_id'
          AND NOT EXISTS (SELECT 1 FROM casc WHERE rel=quote_ident(t.table_name)::regclass::oid)
        ORDER BY 1`)
    ).rows.map((row) => row.table_name);
    expect(rows).toEqual([
      'accounts',
      'admin_audit_events',
      'family_deletion_requests',
      'family_extraction_spend',
      'family_invitations',
      'family_scan_quotas',
      'object_purges',
      'ownership_transfer_offers',
      'push_subscriptions',
      'removed_member_windows',
      'scan_quota_audit',
    ]);
  });
});
