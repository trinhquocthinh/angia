import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import {
  ATTESTATION,
  attestationPath,
  profileConsentFixture,
} from '@src/shared/test/profileConsentFixture.js';

describe('LG-02: receipt và thu hồi lời mời nguyên tử', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-551: lỗi thu hồi link rollback cả receipt, không ghi dữ liệu một phần', async () => {
    const f = await profileConsentFixture(t);
    const profile = await f.create();
    await f.invite(profile.id);
    const before = await f.snapshot(profile.id);
    await t.owner.query(`CREATE FUNCTION reject_test_revocation() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Lỗi giả lập khi thu hồi link'; END; $$;
      CREATE TRIGGER reject_test_revocation BEFORE UPDATE OF revoked_at ON consent_invitations
      FOR EACH ROW EXECUTE FUNCTION reject_test_revocation()`);
    try {
      expect((await t.call(f.main, 'POST', attestationPath(profile.id), ATTESTATION)).status).toBe(500);
      expect(await f.snapshot(profile.id)).toEqual(before);
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_test_revocation ON consent_invitations; DROP FUNCTION reject_test_revocation()',
      );
    }
  });
});
