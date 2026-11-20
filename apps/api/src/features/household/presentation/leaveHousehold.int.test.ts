import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedMembershipProfile } from '@src/shared/test/seedMembershipProfile.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const path = '/api/family/leave';
describe('SPEC-067: tự rời nhà', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const fixture = async () => {
    const family = await t.family();
    const owner = await t.session(family);
    const member = await t.session(family, 'member');
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    const profile = await seedMembershipProfile(t, family, owner.accountId);
    await t.owner.query('UPDATE accounts SET health_profile_id=$1 WHERE id=$2', [profile, member.accountId]);
    const key = `families/${family}/profiles/${profile}/documents/test/upload.jpg`;
    t.objects.set(key, { body: new Uint8Array([1]), contentType: 'image/jpeg' });
    return { family, owner, member, profile, key };
  };

  it('TC-790: giữ hồ sơ và đồng thuận, gỡ liên kết, không tạo cửa sổ tải của người bị gỡ', async () => {
    const f = await fixture();
    const response = await t.call(f.member, 'POST', path, { ownProfileDisposition: 'keep' });
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(
      (
        await t.owner.query('SELECT family_id,family_role,health_profile_id FROM accounts WHERE id=$1', [
          f.member.accountId,
        ])
      ).rows,
    ).toEqual([{ family_id: null, family_role: null, health_profile_id: null }]);
    expect(
      (await t.owner.query('SELECT consent_status FROM health_profiles WHERE id=$1', [f.profile])).rows,
    ).toEqual([{ consent_status: 'confirmed' }]);
    expect(t.objects.has(f.key)).toBe(true);
    expect(
      (await t.owner.query('SELECT * FROM removed_member_windows WHERE account_id=$1', [f.member.accountId]))
        .rowCount,
    ).toBe(0);
    expect(
      (await t.owner.query('SELECT last_member_removed_at FROM families WHERE id=$1', [f.family])).rows[0]
        .last_member_removed_at,
    ).toBeNull();
    expect(
      (
        await t.owner.query(
          "SELECT action,metadata FROM admin_audit_events WHERE actor_account_id=$1 AND action='member_left'",
          [f.member.accountId],
        )
      ).rows,
    ).toEqual([{ action: 'member_left', metadata: {} }]);
  });

  it('TC-791: xoá hồ sơ, ảnh và enqueue job vét; hồ sơ nhà khác còn nguyên', async () => {
    const f = await fixture();
    const other = await fixture();
    const doc = await seedPendingDocument(
      t,
      { familyId: f.family, profileId: f.profile, accountId: f.owner.accountId },
      {},
    );
    expect((await t.call(f.member, 'POST', path, { ownProfileDisposition: 'delete' })).status).toBe(204);
    expect((await t.owner.query('SELECT id FROM health_profiles WHERE id=$1', [f.profile])).rowCount).toBe(0);
    expect(t.objects.has(f.key)).toBe(false);
    expect(t.objects.has(doc.key)).toBe(false);
    expect(
      (await t.owner.query('SELECT id FROM source_documents WHERE id=$1', [doc.documentId])).rowCount,
    ).toBe(0);
    expect(
      (await t.owner.query('SELECT id FROM extractions WHERE source_document_id=$1', [doc.documentId]))
        .rowCount,
    ).toBe(0);
    expect(
      (await t.owner.query('SELECT id FROM upload_batches WHERE health_profile_id=$1', [f.profile])).rowCount,
    ).toBe(0);
    expect(t.objects.has(other.key)).toBe(true);
    expect(
      (
        await t.owner.query(
          "SELECT data FROM pgboss.job WHERE name='purge-profile-objects' AND data->>'profileId'=$1",
          [f.profile],
        )
      ).rows,
    ).toEqual([{ data: { familyId: f.family, profileId: f.profile } }]);
  });

  it('TC-792: thiếu lựa chọn hoặc DTO thừa bị từ chối, membership giữ nguyên', async () => {
    const f = await fixture();
    for (const body of [
      {},
      { ownProfileDisposition: 'keep', familyId: randomUUID() },
      { ownProfileDisposition: 'other' },
    ])
      expect((await t.call(f.member, 'POST', path, body)).status).toBe(422);
    expect(
      (await t.owner.query('SELECT family_id FROM accounts WHERE id=$1', [f.member.accountId])).rows[0]
        .family_id,
    ).toBe(f.family);
  });

  it('TC-793: Chủ hộ còn người khác phải trao quyền trước', async () => {
    const f = await fixture();
    const response = await t.call(f.owner, 'POST', path, {});
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_OWNER_MUST_TRANSFER' } });
  });

  it('TC-794: Chủ hộ một mình phải xoá nhà', async () => {
    const family = await t.family();
    const owner = await t.session(family);
    await t.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [owner.accountId, family]);
    const response = await t.call(owner, 'POST', path, {});
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_OWNER_MUST_DELETE_FAMILY' } });
  });

  it('TC-795: trả đủ hồ sơ trẻ có người giám hộ duy nhất, không thay đổi giám hộ', async () => {
    const f = await fixture();
    const guardian = await t.session(f.family);
    const ids = [];
    for (let i = 0; i < 2; i++) {
      const id = await seedMembershipProfile(t, f.family, f.owner.accountId, new Date().getFullYear() - 5);
      ids.push(id);
      await t.owner.query(
        'INSERT INTO profile_guardians(health_profile_id,family_id,account_id) VALUES($1,$2,$3)',
        [id, f.family, guardian.accountId],
      );
    }
    const response = await t.call(guardian, 'POST', path, {});
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: 'ERR_LAST_GUARDIAN', details: { profileIds: expect.arrayContaining(ids) } },
    });
    expect(
      (await t.owner.query('SELECT * FROM profile_guardians WHERE account_id=$1', [guardian.accountId]))
        .rowCount,
    ).toBe(2);
  });

  it('TC-796: cookie cũ không đọc nhà cũ, vào nhà mới nhận 404 và Push cũ bị xoá', async () => {
    const f = await fixture();
    await t.owner.query(
      "INSERT INTO push_subscriptions(id,family_id,account_id,endpoint_hash,endpoint,p256dh,auth,authorized_at) VALUES(gen_random_uuid(),$1,$2,$3,$4,'key','auth',now())",
      [f.family, f.member.accountId, randomUUID(), `https://push.example/${randomUUID()}`],
    );
    expect((await t.call(f.member, 'POST', path, { ownProfileDisposition: 'keep' })).status).toBe(204);
    const profilePath = (id: string) => `/api/health-profiles/${id}/measurements`;
    expect((await t.call(f.member, 'GET', profilePath(f.profile))).status).toBe(403);
    expect(
      (await t.owner.query('SELECT * FROM push_subscriptions WHERE account_id=$1', [f.member.accountId]))
        .rowCount,
    ).toBe(0);
    const newFamily = await t.family();
    await t.owner.query("UPDATE accounts SET family_id=$1,family_role='main' WHERE id=$2", [
      newFamily,
      f.member.accountId,
    ]);
    await expectCrossFamilyDenied(
      () => t.call(f.member, 'GET', profilePath(f.profile)),
      () => t.call(f.member, 'GET', profilePath(randomUUID())),
    );
  });

  it('TC-790: không liên kết hồ sơ thì được rời với body rỗng; chặn thiếu phiên/CSRF', async () => {
    const family = await t.family();
    const member = await t.session(family, 'member');
    expect((await t.app.request(path, { method: 'POST' })).status).toBe(401);
    expect(
      (
        await t.app.request(path, {
          method: 'POST',
          headers: { cookie: member.cookie, 'content-type': 'application/json' },
          body: '{}',
        })
      ).status,
    ).toBe(403);
    expect((await t.call(member, 'POST', path, {})).status).toBe(204);
    expect((await t.call(member, 'POST', path, {})).status).toBe(403);
  });

  it('TC-791: storage lỗi sau COMMIT vẫn rời nhà thành công và giữ job vét', async () => {
    const f = await fixture();
    t.failNextDeletePrefix();
    expect((await t.call(f.member, 'POST', path, { ownProfileDisposition: 'delete' })).status).toBe(204);
    expect((await t.owner.query('SELECT id FROM health_profiles WHERE id=$1', [f.profile])).rowCount).toBe(0);
    expect(t.objects.has(f.key)).toBe(true);
    expect(
      (await t.owner.query("SELECT id FROM pgboss.job WHERE data->>'profileId'=$1", [f.profile])).rowCount,
    ).toBe(1);
  });
});
