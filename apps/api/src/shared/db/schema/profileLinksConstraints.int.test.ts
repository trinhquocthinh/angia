import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { runMigrations } from '../runMigrations.js';

describe('Ràng buộc liên kết hồ sơ (Tech Spec §3.9.2, BR-050)', () => {
  let db: TestDatabase;
  let owner: pg.Client;
  const familyId = randomUUID();
  const otherFamilyId = randomUUID();
  const accountId = randomUUID();

  const newProfile = async () => {
    const id = randomUUID();
    await owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Mẹ')", [
      id,
      familyId,
    ]);
    return id;
  };
  const insertInvitation = (
    profileId: string,
    fields: {
      family?: string;
      acceptedAt?: Date;
      acceptedBy?: string;
      decision?: string;
      revokedAt?: Date;
    } = {},
  ) =>
    owner.query(
      `INSERT INTO profile_link_invitations(id,family_id,profile_id,token_hash,expires_at,revoked_at,accepted_at,accepted_by_account_id,decision)
       VALUES($1,$2,$3,$4,now() + interval '1 day',$5,$6,$7,$8)`,
      [
        randomUUID(),
        fields.family ?? familyId,
        profileId,
        randomUUID(),
        fields.revokedAt ?? null,
        fields.acceptedAt ?? null,
        fields.acceptedBy ?? null,
        fields.decision ?? null,
      ],
    );
  const insertEvent = (profileId: string, action = 'link', role = 'invitee', family = familyId) =>
    owner.query(
      `INSERT INTO profile_link_events(id,family_id,profile_id,action,actor_role) VALUES($1,$2,$3,$4,$5)`,
      [randomUUID(), family, profileId, action, role],
    );

  beforeAll(async () => {
    db = await startTestDatabase();
    await runMigrations(db.ownerUrl);
    owner = new pg.Client({ connectionString: db.ownerUrl });
    await owner.connect();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà A'),($2,'Nhà B')", [
      familyId,
      otherFamilyId,
    ]);
    await owner.query(
      "INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES($1::uuid,$1::text,'Mẹ',$2,'member')",
      [accountId, familyId],
    );
  });

  afterAll(async () => {
    await owner?.end();
    await db?.container.stop();
  });

  it('mỗi hồ sơ chỉ có một link đang chờ; link đã thu hồi hoặc đã quyết định không tính', async () => {
    const profileId = await newProfile();
    await insertInvitation(profileId, { revokedAt: new Date() });
    await insertInvitation(profileId, {
      acceptedAt: new Date(),
      decision: 'declined',
      acceptedBy: accountId,
    });
    await insertInvitation(profileId);
    await expect(insertInvitation(profileId)).rejects.toMatchObject({ code: '23505' });
  });

  it('accepted_at và decision cùng có hoặc cùng NULL; chưa quyết định thì không có người nhận', async () => {
    const profileId = await newProfile();
    await expect(insertInvitation(profileId, { acceptedAt: new Date() })).rejects.toMatchObject({
      code: '23514',
    });
    await expect(insertInvitation(profileId, { decision: 'accepted' })).rejects.toMatchObject({
      code: '23514',
    });
    await expect(insertInvitation(profileId, { acceptedBy: accountId })).rejects.toMatchObject({
      code: '23514',
    });
    await expect(
      insertInvitation(profileId, { acceptedAt: new Date(), decision: 'khác' }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('xóa tài khoản đã quyết định: giữ link, accepted_by về NULL', async () => {
    const profileId = await newProfile();
    const tempAccount = randomUUID();
    await owner.query(
      "INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES($1::uuid,$1::text,'Tạm',$2,'member')",
      [tempAccount, familyId],
    );
    await insertInvitation(profileId, {
      acceptedAt: new Date(),
      decision: 'accepted',
      acceptedBy: tempAccount,
    });
    await owner.query('DELETE FROM accounts WHERE id = $1', [tempAccount]);
    const { rows } = await owner.query(
      'SELECT accepted_by_account_id, decision FROM profile_link_invitations WHERE profile_id = $1',
      [profileId],
    );
    expect(rows).toEqual([{ accepted_by_account_id: null, decision: 'accepted' }]);
  });

  it('FK ghép chặn hồ sơ khác gia đình ở cả hai bảng', async () => {
    const profileId = await newProfile();
    await expect(insertInvitation(profileId, { family: otherFamilyId })).rejects.toMatchObject({
      code: '23503',
    });
    await expect(insertEvent(profileId, 'link', 'invitee', otherFamilyId)).rejects.toMatchObject({
      code: '23503',
    });
  });

  it('sự kiện chỉ nhận action và actor_role hợp lệ', async () => {
    const profileId = await newProfile();
    await expect(insertEvent(profileId, 'khác')).rejects.toMatchObject({ code: '23514' });
    await expect(insertEvent(profileId, 'link', 'khác')).rejects.toMatchObject({ code: '23514' });
    await insertEvent(profileId, 'transfer', 'admin');
  });

  it('BR-010: xóa hồ sơ xóa link và sự kiện kèm theo', async () => {
    const profileId = await newProfile();
    await insertInvitation(profileId);
    await insertEvent(profileId);
    await owner.query('DELETE FROM health_profiles WHERE id = $1', [profileId]);
    for (const table of ['profile_link_invitations', 'profile_link_events']) {
      const { rowCount } = await owner.query(`SELECT 1 FROM ${table} WHERE profile_id = $1`, [profileId]);
      expect(rowCount).toBe(0);
    }
  });
});
