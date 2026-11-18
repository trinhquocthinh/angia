import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { householdInvitationFixture } from '@src/shared/test/householdInvitationFixture.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

describe('E27-S3-T3: API lời mời lập nhà', () => {
  let t: ProfileTestApp;
  let f: ReturnType<typeof householdInvitationFixture>;
  const path = '/api/admin/founding-invitations';
  beforeAll(async () => {
    t = await startProfileTestApp();
    f = householdInvitationFixture(t);
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-779: admin OIDC phát hành, chỉ lưu hash, nhận mã lập nhà đúng một lần', async () => {
    const admin = await f.waiting(true);
    const response = await t.call(admin, 'POST', path, { kind: 'found_family' });
    expect(response.status).toBe(201);
    const issued = (await response.json()) as {
      invitationId: string;
      link: string;
      code: string;
      expiresAt: string;
    };
    const token = new URLSearchParams(new URL(issued.link).hash.slice(1)).get('token')!;
    expect(token.length).toBeGreaterThanOrEqual(43);
    const row = (await t.owner.query('SELECT * FROM family_invitations WHERE id=$1', [issued.invitationId]))
      .rows[0];
    expect(row).toMatchObject({
      kind: 'found_family',
      family_id: null,
      role: null,
      created_by: admin.accountId,
      token_hash: createHash('sha256').update(token).digest('hex'),
    });
    expect(row.expires_at.getTime() - row.created_at.getTime()).toBe(604800000);
    expect(row.expires_at.toISOString()).toBe(issued.expiresAt);
    const user = await f.waiting();
    expect((await f.accept(user, token)).status).toBe(404);
    await t.owner.query(
      "INSERT INTO system_settings(key,value) VALUES('registration_open','false') ON CONFLICT(key) DO UPDATE SET value='false'",
    );
    try {
      expect(
        (
          await t.call(user, 'POST', '/api/families', {
            name: 'Nhà mới',
            invitationToken: issued.code.toLowerCase(),
          })
        ).status,
      ).toBe(201);
      expect(await f.membership(user.accountId)).toMatchObject({
        family_id: expect.any(String),
        family_role: 'main',
      });
      expect(
        (
          await t.call(await f.waiting(), 'POST', '/api/families', {
            name: 'Nhà khác',
            invitationToken: token,
          })
        ).status,
      ).toBe(403);
    } finally {
      await t.owner.query("UPDATE system_settings SET value='true' WHERE key='registration_open'");
    }
  });
  it('TC-780: main thường và admin phiên local không phát hành được', async () => {
    const member = await t.session(await t.family());
    expect((await t.call(member, 'POST', path, { kind: 'found_family' })).status).toBe(403);
    const admin = await f.waiting(true);
    await t.owner.query("UPDATE sessions SET auth_method='local' WHERE id=$1", [admin.id]);
    expect((await t.call(admin, 'POST', path, { kind: 'found_family' })).status).toBe(403);
    expect(
      (await t.owner.query('SELECT id FROM family_invitations WHERE created_by=$1', [admin.accountId])).rows,
    ).toEqual([]);
  });
  it('người tạo thu hồi một lần; admin khác không phân biệt ID thật với ID thiếu', async () => {
    const admin = await f.waiting(true);
    const response = await t.call(admin, 'POST', path, { kind: 'found_family' });
    expect(response.status).toBe(201);
    const { invitationId } = (await response.json()) as { invitationId: string };
    const other = await f.waiting(true);
    await expectCrossFamilyDenied(
      () => t.call(other, 'DELETE', `${path}/${invitationId}`),
      () => t.call(other, 'DELETE', `${path}/${randomUUID()}`),
    );
    const results = await Promise.all([1, 2].map(() => t.call(admin, 'DELETE', `${path}/${invitationId}`)));
    expect(results.map((r) => r.status).sort()).toEqual([204, 404]);
    expect(
      (
        await t.owner.query(
          'SELECT action FROM admin_audit_events WHERE actor_account_id=$1 ORDER BY occurred_at',
          [admin.accountId],
        )
      ).rows,
    ).toEqual([{ action: 'invitation_created' }, { action: 'invitation_revoked' }]);
  });
});
