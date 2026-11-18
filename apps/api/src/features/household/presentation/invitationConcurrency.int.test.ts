import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { householdInvitationFixture } from '@src/shared/test/householdInvitationFixture.js';

describe('E27-S3-T3: kiểm lại lời mời sau khi chờ khoá', () => {
  let t: ProfileTestApp;
  let f: ReturnType<typeof householdInvitationFixture>;
  beforeAll(async () => {
    t = await startProfileTestApp();
    f = householdInvitationFixture(t);
  });
  afterAll(async () => {
    await t?.stop();
  });
  const waitForFamilyLock = async () => {
    for (let attempt = 0; attempt < 200; attempt++) {
      await t.owner.query('SELECT pg_stat_clear_snapshot()');
      const { rows } = await t.owner.query(
        "SELECT 1 FROM pg_stat_activity WHERE usename=current_user||'_app' AND wait_event_type='Lock' AND query LIKE '%families%' AND query LIKE '%for update%'",
      );
      if (rows.length) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('Request không tới khoá family');
  };
  it.each(['hết hạn', 'thu hồi', 'xoá pending'])(
    'TC-777/781: %s trong lúc đợi family không claim được',
    async (state) => {
      const invite = await f.issue();
      const user = await f.waiting();
      await t.owner.query('BEGIN');
      await t.owner.query('SELECT id FROM families WHERE id=$1 FOR UPDATE', [invite.familyId]);
      const response = f.accept(user, invite.token);
      try {
        await waitForFamilyLock();
        if (state === 'hết hạn')
          await t.owner.query(
            "UPDATE family_invitations SET created_at=clock_timestamp()-interval '8 days',expires_at=clock_timestamp()-interval '1 second' WHERE id=$1",
            [invite.invitationId],
          );
        if (state === 'thu hồi')
          await t.owner.query('UPDATE family_invitations SET revoked_at=clock_timestamp() WHERE id=$1', [
            invite.invitationId,
          ]);
        if (state === 'xoá pending') await f.pendingDeletion(invite.familyId, invite.creator.accountId);
        await t.owner.query('COMMIT');
      } catch (error) {
        await t.owner.query('ROLLBACK');
        await response;
        throw error;
      }
      const result = await response;
      expect(result.status).toBe(state === 'xoá pending' ? 409 : 404);
      expect(await f.state(invite.invitationId)).toMatchObject({ accepted_at: null, accepted_by: null });
      expect(await f.membership(user.accountId)).toMatchObject({ family_id: null });
      expect(await f.audits(user.accountId)).toEqual([]);
    },
  );
  it('TC-778: thu hồi và xác nhận đồng thời chỉ một thao tác thắng', async () => {
    const invite = await f.issue();
    const user = await f.waiting();
    const results = await Promise.all([
      f.accept(user, invite.token),
      t.call(invite.creator, 'DELETE', `/api/family/invitations/${invite.invitationId}`),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([204, 404]);
    const state = await f.state(invite.invitationId);
    expect(Boolean(state.accepted_at)).not.toBe(Boolean(state.revoked_at));
    expect((await f.membership(user.accountId)).family_id).toBe(state.accepted_at ? invite.familyId : null);
  });
});
