import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { familySchema } from '@angia/contracts';
import { randomUUID, createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedAccount, seedSession, type SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { readFamilyQuota } from '@src/features/scanQuota/infrastructure/readFamilyQuota.js';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

describe('E27-S3-T1: API tạo nhà trên role app', () => {
  let t: ProfileTestApp;
  const waiting = async (legalAccepted = true) =>
    seedSession(t.owner, await seedAccount(t.owner, { legalAccepted }));
  const create = (user: SeededSession, body: unknown = { name: 'Nhà Lan' }) =>
    t.call(user, 'POST', '/api/families', body);
  const gate = (open: boolean) =>
    t.owner.query(
      `INSERT INTO system_settings(key,value) VALUES('registration_open',$1::jsonb)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      [JSON.stringify(open)],
    );
  const invite = async (kind = 'found_family') => {
    const token = randomUUID();
    const id = randomUUID();
    const admin = await seedAccount(t.owner, { admin: true });
    const family = kind === 'join_family' ? await t.family() : null;
    await t.owner.query(
      `INSERT INTO family_invitations
      (id,kind,family_id,role,token_hash,code_hash,created_by,expires_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,now()+interval '7 days')`,
      [id, kind, family, family ? 'member' : null, hash(token), hash(randomUUID()), admin],
    );
    return { id, token };
  };
  const familiesOf = async (id: string) =>
    (await t.owner.query('SELECT id FROM families WHERE owner_account_id=$1', [id])).rows;
  const auditOf = async (id: string) =>
    (
      await t.owner.query(
        'SELECT action,metadata FROM admin_audit_events WHERE actor_account_id=$1 ORDER BY action',
        [id],
      )
    ).rows;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  beforeEach(async () => {
    await gate(true);
  });

  it('TC-767: tạo nhà, gán main/Chủ hộ và có lượt mặc định', async () => {
    const user = await waiting();
    const response = await create(user, { name: ' Nhà Lan ' });
    expect(response.status).toBe(201);
    const family = familySchema.parse(await response.json());
    expect(family).toMatchObject({ name: 'Nhà Lan', id: expect.any(String), createdAt: expect.any(String) });
    expect(
      (await t.owner.query('SELECT family_id,family_role FROM accounts WHERE id=$1', [user.accountId])).rows,
    ).toEqual([{ family_id: family.id, family_role: 'main' }]);
    expect(await familiesOf(user.accountId)).toEqual([{ id: family.id }]);
    expect(await readFamilyQuota(t.database, family.id, new Date(), 10)).toMatchObject({
      grantedScans: 10,
      remainingScans: 10,
      usedScans: 0,
      heldScans: 0,
    });
    expect(await auditOf(user.accountId)).toEqual([{ action: 'family_created', metadata: {} }]);
    const me = await t.call(user, 'GET', '/api/me');
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ family: { id: family.id }, role: 'main' });
  });
  it('TC-768: từ chối tài khoản đã có nhà, không ghi thêm', async () => {
    const user = await t.session(await t.family());
    const before = await familiesOf(user.accountId);
    const invitation = await invite();
    const result = await create(user, { name: 'Nhà', invitationToken: invitation.token });
    expect(result.status).toBe(409);
    expect(await result.json()).toMatchObject({ error: { code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY' } });
    expect(await familiesOf(user.accountId)).toEqual(before);
    expect(await auditOf(user.accountId)).toEqual([]);
    expect(
      (
        await t.owner.query('SELECT accepted_at,accepted_by FROM family_invitations WHERE id=$1', [
          invitation.id,
        ])
      ).rows,
    ).toEqual([{ accepted_at: null, accepted_by: null }]);
  });
  it('TC-769: công tắc tắt, thiếu token không tạo nhà', async () => {
    await gate(false);
    const user = await waiting();
    const result = await create(user);
    expect(result.status).toBe(403);
    expect(await result.json()).toMatchObject({ error: { code: 'ERR_REGISTRATION_CLOSED' } });
    expect(await familiesOf(user.accountId)).toEqual([]);
  });
  it('TC-770: dùng found_family một lần, đánh dấu accepted cùng transaction', async () => {
    await gate(false);
    const user = await waiting();
    const invitation = await invite();
    const result = await create(user, { name: 'Nhà Lan', invitationToken: invitation.token });
    expect(result.status).toBe(201);
    expect(
      (
        await t.owner.query('SELECT accepted_by,accepted_at FROM family_invitations WHERE id=$1', [
          invitation.id,
        ])
      ).rows,
    ).toEqual([{ accepted_by: user.accountId, accepted_at: expect.any(Date) }]);
    expect(await auditOf(user.accountId)).toEqual([
      { action: 'family_created', metadata: {} },
      { action: 'invitation_accepted', metadata: {} },
    ]);
    expect(
      (await create(await waiting(), { name: 'Nhà khác', invitationToken: invitation.token })).status,
    ).toBe(403);
  });
  it.each(['sai', 'hết hạn', 'thu hồi', 'join_family'])(
    'TC-769/770: công tắc tắt chặn token %s',
    async (state) => {
      await gate(false);
      const invitation = await invite(state === 'join_family' ? 'join_family' : 'found_family');
      if (state === 'hết hạn')
        await t.owner.query(
          `UPDATE family_invitations SET created_at=now()-interval '8 days',expires_at=now()-interval '1 day' WHERE id=$1`,
          [invitation.id],
        );
      if (state === 'thu hồi')
        await t.owner.query('UPDATE family_invitations SET revoked_at=now() WHERE id=$1', [invitation.id]);
      const user = await waiting();
      const result = await create(user, {
        name: 'Nhà',
        invitationToken: state === 'sai' ? randomUUID() : invitation.token,
      });
      expect(result.status).toBe(403);
      expect(await result.json()).toMatchObject({ error: { code: 'ERR_REGISTRATION_CLOSED' } });
      expect(await familiesOf(user.accountId)).toEqual([]);
      expect(await auditOf(user.accountId)).toEqual([]);
    },
  );
  it('TC-771: hai request cùng tài khoản chỉ tạo đúng một nhà', async () => {
    const user = await waiting();
    const results = await Promise.all([create(user), create(user)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await familiesOf(user.accountId)).toHaveLength(1);
    expect(await auditOf(user.accountId)).toEqual([{ action: 'family_created', metadata: {} }]);
  });
  it('TC-770: hai tài khoản tranh cùng token chỉ một nhà được tạo', async () => {
    await gate(false);
    const users = await Promise.all([waiting(), waiting()]);
    const invitation = await invite();
    const results = await Promise.all(
      users.map((user) => create(user, { name: 'Nhà', invitationToken: invitation.token })),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 403]);
    expect((await Promise.all(users.map((u) => familiesOf(u.accountId)))).flat()).toHaveLength(1);
  });
  it('TC-772: Chủ hộ nhà vừa tạo không đọc hồ sơ nhà khác bằng cookie cũ', async () => {
    const user = await waiting();
    const created = await create(user);
    expect(created.status).toBe(201);
    const ownFamily = familySchema.parse(await created.json());
    const ownProfile = randomUUID();
    await t.owner.query(
      `INSERT INTO health_profiles(id,family_id,display_name,birth_year) VALUES($1,$2,'Của nhà',1990)`,
      [ownProfile, ownFamily.id],
    );
    await confirmConsentByAttestation(t, user, ownProfile);
    expect((await t.call(user, 'GET', `/api/health-profiles/${ownProfile}/measurements`)).status).toBe(200);
    const family = await t.family();
    const id = randomUUID();
    await t.owner.query(
      `INSERT INTO health_profiles(id,family_id,display_name,birth_year) VALUES($1,$2,'Hồ sơ',1990)`,
      [id, family],
    );
    await expectCrossFamilyDenied(
      () => t.call(user, 'GET', `/api/health-profiles/${id}/measurements`),
      () => t.call(user, 'GET', `/api/health-profiles/${randomUUID()}/measurements`),
    );
  });
  it('chặn khi chưa đồng ý pháp lý và không ghi dữ liệu', async () => {
    const user = await waiting(false);
    const result = await create(user);
    expect(result.status).toBe(403);
    expect(await result.json()).toMatchObject({ error: { code: 'ERR_LEGAL_ACCEPTANCE_REQUIRED' } });
    expect(await familiesOf(user.accountId)).toEqual([]);
  });
  it('giữ cổng phiên và CSRF', async () => {
    expect((await t.app.request('/api/families', { method: 'POST' })).status).toBe(401);
    const user = await waiting();
    const result = await t.app.request('/api/families', {
      method: 'POST',
      headers: {
        cookie: user.cookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ name: 'Nhà' }),
    });
    expect(result.status).toBe(403);
    expect(await familiesOf(user.accountId)).toEqual([]);
  });
  it.each([{ name: '' }, { name: 'x'.repeat(61) }, { name: 'Nhà', invitationToken: '' }])(
    'từ chối DTO không hợp lệ %#',
    async (body) => {
      expect((await create(await waiting(), body)).status).toBe(422);
    },
  );
  it('rollback nhà, membership, lời mời và audit khi ghi nhật ký thất bại', async () => {
    await gate(false);
    const user = await waiting();
    const invitation = await invite();
    await t.owner
      .query(`CREATE FUNCTION public.reject_test_family_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action='family_created' THEN RAISE EXCEPTION 'Lỗi thử'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_test_family_audit BEFORE INSERT ON admin_audit_events
      FOR EACH ROW EXECUTE FUNCTION public.reject_test_family_audit()`);
    try {
      expect((await create(user, { name: 'Nhà', invitationToken: invitation.token })).status).toBe(500);
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_test_family_audit ON admin_audit_events; DROP FUNCTION public.reject_test_family_audit()',
      );
    }
    expect(await familiesOf(user.accountId)).toEqual([]);
    expect(await auditOf(user.accountId)).toEqual([]);
    expect(
      (await t.owner.query('SELECT family_id,family_role FROM accounts WHERE id=$1', [user.accountId])).rows,
    ).toEqual([{ family_id: null, family_role: null }]);
    expect(
      (
        await t.owner.query('SELECT accepted_at,accepted_by FROM family_invitations WHERE id=$1', [
          invitation.id,
        ])
      ).rows,
    ).toEqual([{ accepted_at: null, accepted_by: null }]);
  });
});
