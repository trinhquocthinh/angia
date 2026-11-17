import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { seedAccount, seedSession } from '@src/shared/test/seedAuthFixtures.js';
import { registerLocalAccount } from '../application/registerLocalAccount.js';

describe('E27-S3-T3: đăng ký bằng lời mời thật', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });
  beforeEach(async () => {
    await t.owner.query(
      "INSERT INTO system_settings(key,value) VALUES('registration_open','false') ON CONFLICT(key) DO UPDATE SET value='false'",
    );
  });
  const invite = async (kind = 'join_family') => {
    const id = randomUUID(),
      token = randomUUID(),
      familyId = kind === 'join_family' ? randomUUID() : null;
    const creator = await seedAccount(t.owner, { admin: kind === 'found_family' });
    if (familyId) await t.owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà')", [familyId]);
    await t.owner.query(
      "INSERT INTO family_invitations(id,kind,family_id,role,token_hash,code_hash,created_by,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,now()+interval '7 days')",
      [
        id,
        kind,
        familyId,
        familyId ? 'member' : null,
        createHash('sha256').update(token).digest('hex'),
        createHash('sha256').update(randomUUID()).digest('hex'),
        creator,
      ],
    );
    return { id, token, familyId };
  };
  const input = (token: string) => ({
    username: `u${randomUUID().replaceAll('-', '').slice(0, 20)}`,
    password: 'StrongPassword123',
    displayName: 'Người mới',
    ageConfirmed: true,
    legalAcceptance: t.legalAcceptance,
    invitationToken: token,
  });
  const state = async (id: string) =>
    (await t.owner.query('SELECT accepted_at,accepted_by FROM family_invitations WHERE id=$1', [id])).rows[0];
  const counts = async () =>
    (
      await t.owner.query(
        'SELECT (SELECT count(*) FROM accounts) AS accounts,(SELECT count(*) FROM account_credentials) AS credentials,(SELECT count(*) FROM legal_acceptances) AS legal,(SELECT count(*) FROM sessions) AS sessions',
      )
    ).rows[0];

  it('TC-741/775: đăng ký bằng join_family claim một lần và không liên kết hồ sơ', async () => {
    const invitation = await invite();
    const result = await registerLocalAccount(t.account, input(invitation.token));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.account.familyId).toBe(invitation.familyId);
    expect(await state(invitation.id)).toEqual({
      accepted_at: expect.any(Date),
      accepted_by: result.value.account.id,
    });
    expect(
      (
        await t.owner.query('SELECT family_role,health_profile_id FROM accounts WHERE id=$1', [
          result.value.account.id,
        ])
      ).rows,
    ).toEqual([{ family_role: 'member', health_profile_id: null }]);
    expect(
      (
        await t.owner.query('SELECT action FROM admin_audit_events WHERE actor_account_id=$1', [
          result.value.account.id,
        ])
      ).rows,
    ).toEqual([{ action: 'invitation_accepted' }]);
  });
  it('TC-779: found_family cho đăng ký nhưng giữ pending đến khi lập nhà', async () => {
    const invitation = await invite('found_family');
    const result = await registerLocalAccount(t.account, input(invitation.token));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.account.familyId).toBeNull();
    expect(await state(invitation.id)).toEqual({ accepted_at: null, accepted_by: null });
  });
  it('TC-779: API admin → đăng ký → tạo nhà bằng cookie mới, thành Chủ hộ', async () => {
    const admin = await seedSession(t.owner, await seedAccount(t.owner, { admin: true }));
    const issuedResponse = await t.app.request('/api/admin/founding-invitations', {
      method: 'POST',
      headers: { cookie: admin.cookie, 'x-csrf-token': admin.csrf, 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'found_family' }),
    });
    expect(issuedResponse.status).toBe(201);
    const issued = (await issuedResponse.json()) as { invitationId: string; code: string };
    const registered = await t.app.request('/api/auth/register', {
      method: 'POST',
      headers: { origin: 'https://angia.example', 'content-type': 'application/json' },
      body: JSON.stringify(input(issued.code)),
    });
    expect(registered.status).toBe(201);
    const body = (await registered.json()) as {
      account: { id: string; familyId: string | null };
      session: { csrfToken: string };
    };
    expect(body.account.familyId).toBeNull();
    expect(await state(issued.invitationId)).toEqual({ accepted_at: null, accepted_by: null });
    const created = await t.app.request('/api/families', {
      method: 'POST',
      headers: {
        cookie: registered.headers.get('set-cookie')!.split(';')[0]!,
        'x-csrf-token': body.session.csrfToken,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Nhà mới', invitationToken: issued.code }),
    });
    expect(created.status).toBe(201);
    const family = (await created.json()) as { id: string };
    expect(
      (await t.owner.query('SELECT owner_account_id FROM families WHERE id=$1', [family.id])).rows,
    ).toEqual([{ owner_account_id: body.account.id }]);
    expect(await state(issued.invitationId)).toEqual({
      accepted_at: expect.any(Date),
      accepted_by: body.account.id,
    });
  });
  it('TC-778: hai đăng ký cùng token chỉ ghi một account/credential, hai pháp lý và một phiên', async () => {
    const invitation = await invite();
    const before = await counts();
    const results = await Promise.all(
      [1, 2].map(() => registerLocalAccount(t.account, input(invitation.token))),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toMatchObject({
      ok: false,
      code: expect.stringMatching(/^ERR_(NOT_FOUND|REGISTRATION_CLOSED)$/),
    });
    const after = await counts();
    expect(Number(after.accounts) - Number(before.accounts)).toBe(1);
    expect(Number(after.credentials) - Number(before.credentials)).toBe(1);
    expect(Number(after.legal) - Number(before.legal)).toBe(2);
    expect(Number(after.sessions) - Number(before.sessions)).toBe(1);
  });
  it('rollback đăng ký và claim nếu audit thất bại', async () => {
    const invitation = await invite();
    const before = await counts();
    await t.owner
      .query(`CREATE FUNCTION public.reject_registration_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Lỗi thử'; END $$;
      CREATE TRIGGER reject_registration_audit BEFORE INSERT ON admin_audit_events FOR EACH ROW EXECUTE FUNCTION public.reject_registration_audit()`);
    try {
      await expect(registerLocalAccount(t.account, input(invitation.token))).rejects.toThrow();
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_registration_audit ON admin_audit_events; DROP FUNCTION public.reject_registration_audit()',
      );
    }
    expect(await counts()).toEqual(before);
    expect(await state(invitation.id)).toEqual({ accepted_at: null, accepted_by: null });
  });
  it('TC-743/896: lỗi ghi pháp lý sau account/credential rollback tất cả', async () => {
    const invitation = await invite();
    const before = await counts();
    await t.owner
      .query(`CREATE FUNCTION public.reject_registration_legal() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Lỗi thử'; END $$;
      CREATE TRIGGER reject_registration_legal BEFORE INSERT ON legal_acceptances FOR EACH ROW EXECUTE FUNCTION public.reject_registration_legal()`);
    try {
      await expect(registerLocalAccount(t.account, input(invitation.token))).rejects.toThrow();
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_registration_legal ON legal_acceptances; DROP FUNCTION public.reject_registration_legal()',
      );
    }
    expect(await counts()).toEqual(before);
    expect(await state(invitation.id)).toEqual({ accepted_at: null, accepted_by: null });
  });
});
