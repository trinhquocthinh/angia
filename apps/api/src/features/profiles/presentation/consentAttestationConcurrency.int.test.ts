import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import {
  ATTESTATION,
  attestationPath,
  linkCall,
  profileConsentFixture,
} from '@src/shared/test/profileConsentFixture.js';

// Quan sát request thực sự chờ khóa; không suy đoán thứ tự bằng một khoảng sleep cố định.
async function waitForProfileWaiters(t: ProfileTestApp, count: number) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const row = (
      await t.pool.query(`SELECT count(*)::int AS n FROM pg_stat_activity
      WHERE usename=current_user AND wait_event_type='Lock' AND query ILIKE '%health_profiles%'`)
    ).rows[0];
    if (row.n >= count) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Request không đi tới khóa hồ sơ');
}
describe('LG-02: tranh chấp cam kết của main và link liên kết (SPEC-040)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it.each(['attestation', 'invitation'] as const)(
    'TC-557: %s lấy khóa trước, kết quả cuối luôn là self gắn tài khoản người được mời',
    async (winner) => {
      const f = await profileConsentFixture(t);
      const member = await t.session(f.familyId, 'member', 'Chính chủ');
      const profile = await f.create();
      const link = await f.invite(profile.id);
      const calls = {
        attestation: () => t.call(f.main, 'POST', attestationPath(profile.id), ATTESTATION),
        invitation: () => linkCall(t, member, link.token, { decision: 'accepted' }),
      };
      const pending: Promise<Response>[] = [];
      await t.owner.query('BEGIN');
      try {
        await t.owner.query('SELECT id FROM health_profiles WHERE id=$1 FOR UPDATE', [profile.id]);
        pending.push(Promise.resolve(calls[winner]()));
        await waitForProfileWaiters(t, 1);
        pending.push(Promise.resolve(calls[winner === 'attestation' ? 'invitation' : 'attestation']()));
        await waitForProfileWaiters(t, 2);
        await t.owner.query('COMMIT');
      } finally {
        await t.owner.query('ROLLBACK');
        await Promise.allSettled(pending);
      }
      const responses = await Promise.all(pending);
      // Cam kết đến sau khi tài khoản đã liên kết thì bị chặn; link đến sau cam kết nâng nguồn lên self.
      expect(responses.map((r) => r.status)).toEqual(winner === 'attestation' ? [200, 200] : [200, 409]);
      const row = (await f.snapshot(profile.id)).profile;
      expect(row).toMatchObject({
        consent_status: 'confirmed',
        consent_source: 'self',
        consent_respondent_name: 'Chính chủ',
        consent_confirmed_by: member.accountId,
      });
      const linked = await t.owner.query('SELECT 1 FROM accounts WHERE id=$1 AND health_profile_id=$2', [
        member.accountId,
        profile.id,
      ]);
      expect(linked.rowCount).toBe(1);
    },
  );
});
