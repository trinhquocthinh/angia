import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { householdInvitationFixture } from '@src/shared/test/householdInvitationFixture.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

describe('E27-S3-T3: xác nhận lời mời vào nhà', () => {
  let t: ProfileTestApp;
  let f: ReturnType<typeof householdInvitationFixture>;
  beforeAll(async () => {
    t = await startProfileTestApp();
    f = householdInvitationFixture(t);
  });
  afterAll(async () => {
    await t?.stop();
  });

  it.each(['member', 'main'])(
    'TC-775: nhận vai trò %s, không liên kết hồ sơ, cookie cũ thấy nhà mới',
    async (role) => {
      const invite = await f.issue(role);
      const user = await f.waiting();
      const result = await f.accept(user, invite.token);
      expect(result.status).toBe(204);
      expect(result.headers.get('cache-control')).toBe('no-store');
      expect(await f.membership(user.accountId)).toEqual({
        family_id: invite.familyId,
        family_role: role,
        health_profile_id: null,
      });
      expect(await f.state(invite.invitationId)).toMatchObject({
        accepted_at: expect.any(Date),
        accepted_by: user.accountId,
      });
      expect(await f.audits(user.accountId)).toEqual([{ action: 'invitation_accepted', metadata: {} }]);
      expect(await (await t.call(user, 'GET', '/api/me')).json()).toMatchObject({
        family: { id: invite.familyId },
        role,
      });
    },
  );
  it('TC-775: nhận bằng mã nhập thường và khoảng trắng', async () => {
    const invite = await f.issue();
    expect((await f.accept(await f.waiting(), ` ${invite.code.toLowerCase()} `)).status).toBe(204);
  });
  it('TC-776: đã có nhà không tiêu lời mời', async () => {
    const invite = await f.issue();
    const user = await t.session(await t.family());
    const before = await f.membership(user.accountId);
    const result = await f.accept(user, invite.token);
    expect(result.status).toBe(409);
    expect(await result.json()).toMatchObject({ error: { code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY' } });
    expect(await f.membership(user.accountId)).toEqual(before);
    expect(await f.state(invite.invitationId)).toMatchObject({ accepted_at: null, accepted_by: null });
  });
  it.each(['đã dùng', 'hết hạn', 'thu hồi', 'sai'])('TC-777: lời mời %s trả cùng lỗi 404', async (state) => {
    const invite = await f.issue();
    if (state === 'đã dùng') expect((await f.accept(await f.waiting(), invite.token)).status).toBe(204);
    if (state === 'hết hạn')
      await t.owner.query(
        "UPDATE family_invitations SET created_at=now()-interval '8 days',expires_at=now()-interval '1 day' WHERE id=$1",
        [invite.invitationId],
      );
    if (state === 'thu hồi')
      expect(
        (await t.call(invite.creator, 'DELETE', `/api/family/invitations/${invite.invitationId}`)).status,
      ).toBe(204);
    const user = await f.waiting();
    await expectCrossFamilyDenied(
      () => f.accept(user, state === 'sai' ? randomUUID() : invite.token),
      () => f.accept(user, randomUUID()),
    );
    expect(await f.membership(user.accountId)).toMatchObject({ family_id: null });
    expect(await f.audits(user.accountId)).toEqual([]);
  });
  it('TC-778: hai tài khoản tranh một token, đúng một 204 và một 404', async () => {
    const invite = await f.issue();
    const users = await Promise.all([f.waiting(), f.waiting()]);
    const results = await Promise.all(users.map((user) => f.accept(user, invite.token)));
    expect(results.map((r) => r.status).sort()).toEqual([204, 404]);
    const winner = users[results.findIndex((r) => r.status === 204)]!;
    expect(await f.state(invite.invitationId)).toMatchObject({ accepted_by: winner.accountId });
    expect((await Promise.all(users.map((u) => f.audits(u.accountId)))).flat()).toHaveLength(1);
  });
  it('TC-778: một tài khoản nhận hai lời mời đồng thời chỉ vào một nhà', async () => {
    const invites = await Promise.all([f.issue(), f.issue()]);
    const user = await f.waiting();
    const results = await Promise.all(invites.map((i) => f.accept(user, i.token)));
    expect(results.map((r) => r.status).sort()).toEqual([204, 409]);
    expect(
      (await Promise.all(invites.map((i) => f.state(i.invitationId)))).filter((i) => i.accepted_at),
    ).toHaveLength(1);
    expect(await f.audits(user.accountId)).toHaveLength(1);
  });
  it('TC-781: nhà pending deletion không nhận thành viên và không tiêu token', async () => {
    const invite = await f.issue();
    await f.pendingDeletion(invite.familyId, invite.creator.accountId);
    const user = await f.waiting();
    const result = await f.accept(user, invite.token);
    expect(result.status).toBe(409);
    expect(await result.json()).toMatchObject({ error: { code: 'ERR_DELETION_PENDING' } });
    expect(await f.state(invite.invitationId)).toMatchObject({ accepted_at: null });
  });
  it('rollback membership, claim và audit nếu ghi audit thất bại', async () => {
    const invite = await f.issue();
    const user = await f.waiting();
    await t.owner.query(`CREATE FUNCTION public.reject_accept_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action='invitation_accepted' THEN RAISE EXCEPTION 'Lỗi thử'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_accept_audit BEFORE INSERT ON admin_audit_events FOR EACH ROW EXECUTE FUNCTION public.reject_accept_audit()`);
    try {
      expect((await f.accept(user, invite.token)).status).toBe(500);
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_accept_audit ON admin_audit_events; DROP FUNCTION public.reject_accept_audit()',
      );
    }
    expect(await f.membership(user.accountId)).toMatchObject({ family_id: null });
    expect(await f.state(invite.invitationId)).toMatchObject({ accepted_at: null });
    expect(await f.audits(user.accountId)).toEqual([]);
  });
  it('giữ cổng phiên, CSRF, pháp lý, DTO và chặn SystemAdmin vào nhà', async () => {
    const path = '/api/invitations/accept';
    expect((await t.app.request(path, { method: 'POST' })).status).toBe(401);
    const user = await f.waiting();
    expect((await t.app.request(path, { method: 'POST', headers: { cookie: user.cookie } })).status).toBe(
      403,
    );
    expect((await t.call(user, 'POST', path, { token: '' })).status).toBe(422);
    const invite = await f.issue();
    expect((await f.accept(await f.waiting(true), invite.token)).status).toBe(403);
    await t.owner.query(
      'DELETE FROM legal_acceptances WHERE account_ref=(SELECT legal_ref FROM accounts WHERE id=$1)',
      [user.accountId],
    );
    expect((await f.accept(user, invite.token)).status).toBe(403);
  });
});
