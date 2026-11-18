import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
type Issued = { invitationId: string; link: string; code: string; expiresAt: string };

describe('E27-S3-T2: phát hành và thu hồi lời mời vào nhà', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const issue = (user: Parameters<ProfileTestApp['call']>[0], role = 'member') =>
    t.call(user, 'POST', '/api/family/invitations', { kind: 'join_family', role });
  const audit = async (account: string) =>
    (
      await t.owner.query(
        'SELECT action,metadata FROM admin_audit_events WHERE actor_account_id=$1 ORDER BY occurred_at',
        [account],
      )
    ).rows;

  it.each(['main', 'member'])(
    'TC-773: Đồng quản lý mời %s, lưu hash và bản mã, hạn đúng 7 ngày',
    async (role) => {
      const family = await t.family();
      const user = await t.session(family);
      const response = await issue(user, role);
      expect(response.status).toBe(201);
      expect(response.headers.get('cache-control')).toBe('no-store');
      const invitation = (await response.json()) as Issued;
      const url = new URL(invitation.link);
      const token = new URLSearchParams(url.hash.slice(1)).get('token')!;
      expect(url.origin).toBe('http://localhost:5173');
      expect(url.search).toBe('');
      expect(token.length).toBeGreaterThanOrEqual(43);
      expect(invitation.code).toMatch(/^[A-F0-9]{12}$/);
      const { rows } = await t.owner.query('SELECT * FROM family_invitations WHERE id=$1', [
        invitation.invitationId,
      ]);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        kind: 'join_family',
        family_id: family,
        role,
        token_hash: digest(token),
        code_hash: digest(invitation.code),
        created_by: user.accountId,
        revoked_at: null,
        accepted_at: null,
        accepted_by: null,
      });
      expect(rows[0].expires_at.getTime() - rows[0].created_at.getTime()).toBe(604800000);
      expect(rows[0].expires_at.toISOString()).toBe(invitation.expiresAt);
      expect(await audit(user.accountId)).toEqual([{ action: 'invitation_created', metadata: {} }]);
    },
  );

  it('TC-774: Thành viên không phát hành lời mời', async () => {
    const user = await t.session(await t.family(), 'member');
    const result = await issue(user);
    expect(result.status).toBe(403);
    expect(await result.json()).toMatchObject({ error: { code: 'ERR_FORBIDDEN' } });
    expect(await audit(user.accountId)).toEqual([]);
  });

  it('TC-781: chặn phát hành khi nhà có yêu cầu xoá pending', async () => {
    const family = await t.family();
    const user = await t.session(family);
    await t.owner.query(
      `INSERT INTO family_deletion_requests(id,family_id,requested_by,execute_at)
      VALUES($1,$2,$3,now()+interval '30 days')`,
      [randomUUID(), family, user.accountId],
    );
    const result = await issue(user);
    expect(result.status).toBe(409);
    expect(await result.json()).toMatchObject({ error: { code: 'ERR_DELETION_PENDING' } });
    expect(
      (await t.owner.query('SELECT id FROM family_invitations WHERE family_id=$1', [family])).rows,
    ).toEqual([]);
    expect(await audit(user.accountId)).toEqual([]);
  });

  it('TC-867: thu hồi nhà khác giống ID không tồn tại và không đổi dữ liệu', async () => {
    const actor = await t.session(await t.family());
    const victim = await t.session(await t.family());
    const issued = await issue(victim);
    expect(issued.status).toBe(201);
    const { invitationId } = (await issued.json()) as Issued;
    await expectCrossFamilyDenied(
      () => t.call(actor, 'DELETE', `/api/family/invitations/${invitationId}`),
      () => t.call(actor, 'DELETE', `/api/family/invitations/${randomUUID()}`),
    );
    expect(
      (await t.owner.query('SELECT revoked_at FROM family_invitations WHERE id=$1', [invitationId])).rows,
    ).toEqual([{ revoked_at: null }]);
    expect(await audit(actor.accountId)).toEqual([]);
  });

  it.each(['người tạo', 'main cùng nhà'])(
    'thu hồi bởi %s và chỉ một audit khi gọi đồng thời',
    async (who) => {
      const family = await t.family();
      const creator = await t.session(family);
      const response = await issue(creator);
      expect(response.status).toBe(201);
      const { invitationId } = (await response.json()) as Issued;
      const actor = who === 'người tạo' ? creator : await t.session(family);
      const results = await Promise.all(
        [1, 2].map(() => t.call(actor, 'DELETE', `/api/family/invitations/${invitationId}`)),
      );
      expect(results.map((r) => r.status).sort()).toEqual([204, 404]);
      expect(
        (await t.owner.query('SELECT revoked_at FROM family_invitations WHERE id=$1', [invitationId])).rows,
      ).toEqual([{ revoked_at: expect.any(Date) }]);
      const events = await audit(actor.accountId);
      expect(events.filter((e) => e.action === 'invitation_revoked')).toEqual([
        { action: 'invitation_revoked', metadata: {} },
      ]);
    },
  );

  it('người tạo đã hạ thành member vẫn thu hồi được, member khác bị chặn', async () => {
    const family = await t.family();
    const creator = await t.session(family);
    const issued = await issue(creator);
    expect(issued.status).toBe(201);
    const { invitationId } = (await issued.json()) as Issued;
    await t.owner.query("UPDATE accounts SET family_role='member' WHERE id=$1", [creator.accountId]);
    const member = await t.session(family, 'member');
    expect((await t.call(member, 'DELETE', `/api/family/invitations/${invitationId}`)).status).toBe(403);
    expect((await t.call(creator, 'DELETE', `/api/family/invitations/${invitationId}`)).status).toBe(204);
  });

  it.each(['thu hồi', 'đã dùng', 'hết hạn'])('không thu hồi lời mời %s lần nữa', async (state) => {
    const user = await t.session(await t.family());
    const response = await issue(user);
    expect(response.status).toBe(201);
    const { invitationId } = (await response.json()) as Issued;
    const changes = {
      'thu hồi': 'revoked_at=now()',
      'đã dùng': 'accepted_at=now(),accepted_by=created_by',
      'hết hạn': "created_at=now()-interval '8 days',expires_at=now()-interval '1 day'",
    }[state]!;
    await t.owner.query(`UPDATE family_invitations SET ${changes} WHERE id=$1`, [invitationId]);
    const result = await t.call(user, 'DELETE', `/api/family/invitations/${invitationId}`);
    expect(result.status).toBe(404);
    expect(await result.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
    expect((await audit(user.accountId)).filter((e) => e.action === 'invitation_revoked')).toEqual([]);
  });

  it.each([
    {},
    { kind: 'join_family', role: 'owner' },
    { kind: 'found_family' },
    { kind: 'join_family', role: 'member', familyId: randomUUID() },
  ])('từ chối DTO không hợp lệ %#', async (body) => {
    const user = await t.session(await t.family());
    expect((await t.call(user, 'POST', '/api/family/invitations', body)).status).toBe(422);
  });

  it.each(['chưa có nhà', 'đã rời', 'đã sang nhà khác'])(
    'TC-871/872: cookie cũ %s không quản lý nhà cũ',
    async (state) => {
      const family = await t.family();
      const user = await t.session(family);
      const response = await issue(user);
      expect(response.status).toBe(201);
      const { invitationId } = (await response.json()) as Issued;
      if (state === 'chưa có nhà') {
        const waiting = await seedSession(t.owner, await seedAccount(t.owner));
        expect((await issue(waiting)).status).toBe(403);
        expect((await t.call(waiting, 'DELETE', `/api/family/invitations/${invitationId}`)).status).toBe(403);
      } else {
        const nextFamily = state === 'đã rời' ? null : await t.family();
        await t.owner.query('UPDATE accounts SET family_id=$1,family_role=$2 WHERE id=$3', [
          nextFamily,
          nextFamily ? 'main' : null,
          user.accountId,
        ]);
        expect((await t.call(user, 'DELETE', `/api/family/invitations/${invitationId}`)).status).toBe(
          nextFamily ? 404 : 403,
        );
      }
      expect(
        (await t.owner.query('SELECT revoked_at FROM family_invitations WHERE id=$1', [invitationId])).rows,
      ).toEqual([{ revoked_at: null }]);
    },
  );

  it('giữ cổng phiên, CSRF và đồng ý pháp lý cho cả hai route', async () => {
    const family = await t.family();
    const user = await t.session(family);
    const noLegal = await seedSession(
      t.owner,
      await seedAccount(t.owner, { familyId: family, familyRole: 'main', legalAccepted: false }),
    );
    for (const [method, path] of [
      ['POST', '/api/family/invitations'],
      ['DELETE', `/api/family/invitations/${randomUUID()}`],
    ]) {
      expect((await t.app.request(path!, { method: method! })).status).toBe(401);
      expect((await t.app.request(path!, { method: method!, headers: { cookie: user.cookie } })).status).toBe(
        403,
      );
      expect((await t.call(noLegal, method!, path!, { kind: 'join_family', role: 'member' })).status).toBe(
        403,
      );
    }
  });

  it.each(['invitation_created', 'invitation_revoked'])('rollback khi audit %s thất bại', async (action) => {
    const family = await t.family();
    const user = await t.session(family);
    const issued = await issue(user);
    expect(issued.status).toBe(201);
    const { invitationId } = (await issued.json()) as Issued;
    await t.owner
      .query(`CREATE FUNCTION public.reject_test_invitation_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action='${action}' THEN RAISE EXCEPTION 'Lỗi thử'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_test_invitation_audit BEFORE INSERT ON admin_audit_events
      FOR EACH ROW EXECUTE FUNCTION public.reject_test_invitation_audit()`);
    try {
      const result =
        action === 'invitation_created'
          ? await issue(user, 'main')
          : await t.call(user, 'DELETE', `/api/family/invitations/${invitationId}`);
      expect(result.status).toBe(500);
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_test_invitation_audit ON admin_audit_events; DROP FUNCTION public.reject_test_invitation_audit()',
      );
    }
    expect(
      (await t.owner.query('SELECT id,revoked_at FROM family_invitations WHERE family_id=$1', [family])).rows,
    ).toEqual([{ id: invitationId, revoked_at: null }]);
    expect(await audit(user.accountId)).toEqual([{ action: 'invitation_created', metadata: {} }]);
  });
});
