import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { createHouseholdInvitationRepository } from './createHouseholdInvitationRepository.js';

describe('Kho lời mời kiểm lại quyền DB sau snapshot phiên', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-773: port ghi lời mời bằng role app và trả hạn dùng', async () => {
    const familyId = await t.family();
    const user = await t.session(familyId);
    const result = await createHouseholdInvitationRepository(
      t.database,
      'test-invitation-key'.repeat(3),
    ).create({ accountId: user.accountId, familyId, role: 'main' }, 'member');
    expect(result).toMatchObject({ ok: true, value: { expiresAt: expect.any(Date) } });
  });
  it.each(['hạ quyền', 'rời nhà', 'khoá', 'admin'])(
    'TC-774/871: chặn phát hành sau khi %s dù snapshot là main',
    async (state) => {
      const familyId = await t.family();
      const user = await t.session(familyId);
      const change = {
        'hạ quyền': "family_role='member'",
        'rời nhà': 'family_id=NULL,family_role=NULL',
        khoá: 'locked_at=now()',
        admin: 'is_system_admin=true',
      }[state]!;
      await t.owner.query(`UPDATE accounts SET ${change} WHERE id=$1`, [user.accountId]);
      const result = await createHouseholdInvitationRepository(
        t.database,
        'test-invitation-key'.repeat(3),
      ).create({ accountId: user.accountId, familyId, role: 'main' }, 'member');
      expect(result).toEqual({ ok: false, code: state === 'khoá' ? 'ERR_UNAUTHENTICATED' : 'ERR_FORBIDDEN' });
      expect(
        (await t.owner.query('SELECT id FROM family_invitations WHERE created_by=$1', [user.accountId])).rows,
      ).toEqual([]);
    },
  );
  it('TC-871: người tạo đã rời nhà không thu hồi được bằng snapshot cũ', async () => {
    const familyId = await t.family();
    const user = await t.session(familyId);
    const repository = createHouseholdInvitationRepository(t.database, 'test-invitation-key'.repeat(3));
    const actor = { accountId: user.accountId, familyId, role: 'main' as const };
    const created = await repository.create(actor, 'member');
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error('Không tạo được lời mời');
    await t.owner.query('UPDATE accounts SET family_id=NULL,family_role=NULL WHERE id=$1', [user.accountId]);
    expect(await repository.revoke(actor, created.value.invitationId)).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
    expect(await repository.revoke(actor, randomUUID())).toEqual({ ok: false, code: 'ERR_FORBIDDEN' });
  });
});
