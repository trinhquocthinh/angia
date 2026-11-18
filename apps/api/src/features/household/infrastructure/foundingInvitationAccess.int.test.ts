import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedAccount } from '@src/shared/test/seedAuthFixtures.js';
import { createFoundingInvitationRepository } from './createFoundingInvitationRepository.js';

describe('E27-S3-T3: quyền đường lập nhà trên role app', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it('TC-779: kho phát hành bằng NOBYPASSRLS', async () => {
    const admin = await seedAccount(t.owner, { admin: true });
    expect(await createFoundingInvitationRepository(t.database).create(admin)).toMatchObject({
      ok: true,
      value: { expiresAt: expect.any(Date) },
    });
  });
  it('TC-780: hàm đặc quyền không nhận người thường hoặc admin đã mất quyền', async () => {
    const user = await seedAccount(t.owner);
    const digest = 'a'.repeat(64);
    const issue = () =>
      t.database.execute(
        sql`SELECT * FROM public.issue_founding_invitation(${user}::uuid,${randomUUID()}::uuid,${digest},${digest})`,
      );
    expect((await issue()).rows).toEqual([]);
    expect(await createFoundingInvitationRepository(t.database).create(user)).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
    await t.owner.query('UPDATE accounts SET is_system_admin=true,locked_at=now() WHERE id=$1', [user]);
    expect((await issue()).rows).toEqual([]);
  });
  it('TC-868: hàm mới cố định search_path, không EXECUTE PUBLIC hoặc SELECT hash', async () => {
    const { rows } = await t.owner.query(`SELECT p.proname,p.prosecdef,p.proconfig,
      EXISTS(SELECT 1 FROM aclexplode(p.proacl) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS public_execute
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname IN ('issue_founding_invitation','revoke_founding_invitation') ORDER BY p.proname`);
    expect(rows).toHaveLength(2);
    for (const row of rows)
      expect(row).toMatchObject({
        prosecdef: true,
        proconfig: ['search_path=pg_catalog, pg_temp'],
        public_execute: false,
      });
    expect(
      (
        await t.database.execute<{ bypass: boolean }>(
          sql`SELECT rolbypassrls AS bypass FROM pg_roles WHERE rolname=current_user`,
        )
      ).rows,
    ).toEqual([{ bypass: false }]);
    await expect(
      t.database.execute(sql`SELECT token_hash,code_hash FROM family_invitations`),
    ).rejects.toThrow();
    expect((await t.database.execute(sql`SELECT id FROM family_invitations`)).rows).toEqual([]);
  });
  it.each(['invitation_created', 'invitation_revoked'])(
    'rollback lời mời lập nhà khi audit %s thất bại',
    async (action) => {
      const admin = await seedAccount(t.owner, { admin: true });
      const repository = createFoundingInvitationRepository(t.database);
      const issued = await repository.create(admin);
      expect(issued.ok).toBe(true);
      if (!issued.ok) return;
      await t.owner.query(`CREATE FUNCTION public.reject_found_audit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action='${action}' THEN RAISE EXCEPTION 'Lỗi thử'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_found_audit BEFORE INSERT ON admin_audit_events FOR EACH ROW EXECUTE FUNCTION public.reject_found_audit()`);
      try {
        await expect(
          action === 'invitation_created'
            ? repository.create(admin)
            : repository.revoke(admin, issued.value.invitationId),
        ).rejects.toThrow();
      } finally {
        await t.owner.query(
          'DROP TRIGGER reject_found_audit ON admin_audit_events; DROP FUNCTION public.reject_found_audit()',
        );
      }
      expect(
        (await t.owner.query('SELECT id,revoked_at FROM family_invitations WHERE created_by=$1', [admin]))
          .rows,
      ).toEqual([{ id: issued.value.invitationId, revoked_at: null }]);
      expect(
        (await t.owner.query('SELECT action FROM admin_audit_events WHERE actor_account_id=$1', [admin]))
          .rows,
      ).toEqual([{ action: 'invitation_created' }]);
    },
  );
});
