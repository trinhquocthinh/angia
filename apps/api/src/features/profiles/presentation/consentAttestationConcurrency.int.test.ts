import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import {
  ATTESTATION,
  attestationPath,
  invitationCall,
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
describe('LG-02: tranh chấp cam kết và link mời', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it.each(['attestation', 'invitation'] as const)(
    'TC-557: %s lấy khóa trước, chỉ một nguồn receipt được ghi',
    async (winner) => {
      const f = await profileConsentFixture(t);
      const profile = await f.create();
      const link = await f.invite(profile.id);
      const calls = {
        attestation: () => t.call(f.main, 'POST', attestationPath(profile.id), ATTESTATION),
        invitation: () =>
          invitationCall(t, link.token, { decision: 'accepted', basis: 'self', respondentName: 'Chính chủ' }),
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
      expect(responses.map((r) => r.status)).toEqual(winner === 'attestation' ? [200, 404] : [200, 200]);
      const saved = await f.snapshot(profile.id);
      const row = saved.profile;
      expect(row.consent_status).toBe('confirmed');
      expect(row.consent_source).toBe(winner === 'attestation' ? 'main_attested' : 'invitation');
      expect(row.consent_respondent_name).toBe(winner === 'attestation' ? 'Mẹ' : 'Chính chủ');
      expect(row.consent_confirmed_by).toBe(winner === 'attestation' ? f.main.accountId : null);
      if (winner === 'attestation') {
        expect(saved.invitations[0].decision).toBeNull();
        expect(saved.invitations[0].revoked_at).not.toBeNull();
      } else {
        expect(saved.invitations[0].decision).toBe('accepted');
        expect(saved.invitations[0].revoked_at).toBeNull();
        expect(await responses[1]!.json()).toMatchObject({
          consentSource: 'invitation',
          consentRespondentName: 'Chính chủ',
          consentConfirmedAt: row.consent_confirmed_at.toISOString(),
        });
      }
    },
  );
});
