import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const base = '/api/health-profiles';

describe('Cam kết của main khi tạo link: PostgreSQL thật', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const invitationPath = (id: string) => `${base}/${id}/consent-invitations`;
  const attest = { attestation: true };
  it('TC-375 tạo link bắt buộc cam kết: thiếu body hoặc false → 422, true → 201 và lưu thời điểm cam kết', async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', base, { birthYear: 1950, displayName: 'Bà' })
    ).json()) as HealthProfile;
    const path = invitationPath(profile.id);
    for (const body of [undefined, {}, { attestation: false }, { attestation: true, extra: 1 }]) {
      const denied = await t.call(main, 'POST', path, body);
      expect(denied.status, JSON.stringify(body) ?? 'no body').toBe(422);
      expect(((await denied.json()) as { error: { code: string } }).error.code).toBe('ERR_VALIDATION');
    }
    expect((await t.call(main, 'POST', path, attest)).status).toBe(201);
    const rows = await t.owner.query(
      'select inviter_attested_at from consent_invitations where profile_id = $1',
      [profile.id],
    );
    expect(rows.rows).toHaveLength(1);
    expect((rows.rows[0] as { inviter_attested_at: Date | null }).inviter_attested_at).not.toBeNull();
  });
});
