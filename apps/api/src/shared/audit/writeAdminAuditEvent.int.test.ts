import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedAccount } from '@src/shared/test/seedAuthFixtures.js';
import { writeAdminAuditEvent } from './writeAdminAuditEvent.js';

describe('E27-S4-T1: bộ ghi nhật ký quản lý', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  it('TC-839: chỉ ghi trường đã cho phép, không chuyển tiếp metadata hoặc ID từ đầu vào', async () => {
    const actorAccountId = await seedAccount(t.owner);
    const input = {
      id: randomUUID(),
      actorAccountId,
      action: 'family_created' as const,
      familyId: randomUUID(),
      targetAccountId: actorAccountId,
      targetProfileId: randomUUID(),
      metadata: { password: 'MatKhauBiMat', token: 'TokenBiMat', medicine: 'ThuocBiMat', measurement: 123 },
    };
    await t.database.transaction((tx) => writeAdminAuditEvent(tx, input));
    const { rows } = await t.owner.query('SELECT * FROM admin_audit_events WHERE actor_account_id=$1', [
      actorAccountId,
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actor_account_id: actorAccountId,
      family_id: input.familyId,
      target_account_id: actorAccountId,
      target_profile_id: input.targetProfileId,
      action: 'family_created',
      metadata: {},
      occurred_at: expect.any(Date),
    });
    expect(rows[0].id).not.toBe(input.id);
  });

  it('TC-840: rollback sau khi đã ghi audit không giữ sự kiện', async () => {
    const actorAccountId = await seedAccount(t.owner);
    await expect(
      t.database.transaction(async (tx) => {
        await writeAdminAuditEvent(tx, { actorAccountId, action: 'invitation_created' });
        await tx.execute('SELECT 1 / 0');
      }),
    ).rejects.toThrow();
    expect(
      (await t.owner.query('SELECT id FROM admin_audit_events WHERE actor_account_id=$1', [actorAccountId]))
        .rows,
    ).toEqual([]);
  });

  it('TC-839: sự kiện thành viên chỉ nhận lý do do máy chủ cấp, không chuyển tiếp metadata', async () => {
    const actorAccountId = await seedAccount(t.owner);
    for (const action of ['member_removed', 'member_role_changed']) {
      const input = {
        actorAccountId,
        action: action as Parameters<typeof writeAdminAuditEvent>[1]['action'],
        metadata: { reason: 'Giá trị giả', password: 'BiMat', measurement: 123 },
      };
      await t.database.transaction((tx) => writeAdminAuditEvent(tx, input));
    }
    expect(
      (
        await t.owner.query(
          'SELECT action,metadata FROM admin_audit_events WHERE actor_account_id=$1 ORDER BY action',
          [actorAccountId],
        )
      ).rows,
    ).toEqual([
      { action: 'member_removed', metadata: { reason: 'removed_from_family' } },
      { action: 'member_role_changed', metadata: {} },
    ]);
  });

  it('TC-839: từ chối action ngoài danh sách ngay cả khi đầu vào vượt qua kiểm tra kiểu', async () => {
    const actorAccountId = await seedAccount(t.owner);
    const action = 'unknown_action' as Parameters<typeof writeAdminAuditEvent>[1]['action'];
    await expect(
      t.database.transaction((tx) => writeAdminAuditEvent(tx, { actorAccountId, action })),
    ).rejects.toThrow('Loại sự kiện quản lý không hợp lệ');
    expect(
      (await t.owner.query('SELECT id FROM admin_audit_events WHERE actor_account_id=$1', [actorAccountId]))
        .rows,
    ).toEqual([]);
  });
});
