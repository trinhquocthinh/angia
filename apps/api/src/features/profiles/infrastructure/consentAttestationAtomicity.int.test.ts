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
    // Dữ liệu cũ: link đồng thuận ẩn danh chưa dùng (migration E14 thu hồi, nhưng cam kết vẫn dọn nếu còn).
    await t.owner.query(
      `INSERT INTO consent_invitations(id,family_id,profile_id,token_hash,expires_at)
       VALUES(gen_random_uuid(),$1,$2,'legacy-hash',now() + interval '1 day')`,
      [f.familyId, profile.id],
    );
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
