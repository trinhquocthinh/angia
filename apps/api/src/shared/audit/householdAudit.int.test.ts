import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { seedAccount } from '@src/shared/test/seedAuthFixtures.js';
import { createHouseholdRepository } from '@src/features/household/infrastructure/createHouseholdRepository.js';
import { createHouseholdInvitationRepository } from '@src/features/household/infrastructure/createHouseholdInvitationRepository.js';
import { createInvitationAcceptanceRepository } from '@src/features/household/infrastructure/createInvitationAcceptanceRepository.js';
import { createFoundingInvitationRepository } from '@src/features/household/infrastructure/createFoundingInvitationRepository.js';

async function prepare(t: ProfileTestApp) {
  const creator = await seedAccount(t.owner);
  const joiner = await seedAccount(t.owner);
  const admin = await seedAccount(t.owner, { admin: true });
  const familyId = await t.family();
  const owner = await seedAccount(t.owner, { familyId, familyRole: 'main' });
  const actor = { accountId: owner, familyId, role: 'main' as const };
  const household = createHouseholdRepository(t.database);
  const invitations = createHouseholdInvitationRepository(t.database);
  const acceptance = createInvitationAcceptanceRepository(t.database);
  const founding = createFoundingInvitationRepository(t.database);
  const join = await invitations.create(actor, 'member');
  const found = await founding.create(admin);
  if (!join.ok || !found.ok) throw new Error('Không tạo được dữ liệu lời mời');
  const foundToken = found.value.token;
  const foundId = found.value.invitationId;
  const joinToken = join.value.token;
  const joinId = join.value.invitationId;
  return [
    {
      actor: creator,
      actions: ['family_created'],
      target: creator,
      run: () => household.create(creator, { name: 'Nhà thử' }),
    },
    {
      actor: creator,
      actions: ['family_created', 'invitation_accepted'],
      target: creator,
      run: () => household.create(creator, { name: 'Nhà thử', invitationToken: foundToken }),
    },
    {
      actor: owner,
      actions: ['invitation_created'],
      target: null,
      run: () => invitations.create(actor, 'member'),
    },
    {
      actor: owner,
      actions: ['invitation_revoked'],
      target: null,
      run: () => invitations.revoke(actor, joinId),
    },
    {
      actor: joiner,
      actions: ['invitation_accepted'],
      target: joiner,
      run: () => acceptance.accept(joiner, joinToken),
    },
    { actor: admin, actions: ['invitation_created'], target: null, run: () => founding.create(admin) },
    {
      actor: admin,
      actions: ['invitation_revoked'],
      target: null,
      run: () => founding.revoke(admin, foundId),
    },
  ];
}

async function snapshot(t: ProfileTestApp) {
  const tables = ['accounts', 'families', 'family_invitations', 'admin_audit_events'];
  const result: Record<string, unknown> = {};
  for (const table of tables)
    result[table] = (await t.owner.query(`SELECT * FROM ${table} ORDER BY id`)).rows;
  return result;
}

const cases = [
  'tạo nhà',
  'tạo nhà bằng lời mời',
  'mời vào nhà',
  'thu hồi lời mời vào nhà',
  'xác nhận vào nhà',
  'mời lập nhà',
  'thu hồi lời mời lập nhà',
].map((name, index) => ({ name, index }));

describe('E27-S4-T1: audit của các thao tác nhà hiện có', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
    await t.owner.query("UPDATE system_settings SET value='true'::jsonb WHERE key='registration_open'");
  });
  afterAll(async () => {
    await t?.stop();
  });

  it.each(cases)('TC-839: $name chỉ thêm đúng sự kiện tương ứng', async ({ index }) => {
    const operation = (await prepare(t))[index]!;
    const before = (await t.owner.query('SELECT id FROM admin_audit_events')).rows.map((r) => r.id);
    expect(await operation.run()).toMatchObject({ ok: true });
    const { rows } = await t.owner.query(
      'SELECT * FROM admin_audit_events WHERE NOT (id=ANY($1::uuid[])) ORDER BY action',
      [before],
    );
    expect(rows).toHaveLength(operation.actions.length);
    expect(rows.map((row) => row.action)).toEqual([...operation.actions].sort());
    const { rows: accounts } = await t.owner.query('SELECT family_id FROM accounts WHERE id=$1', [
      operation.actor,
    ]);
    for (const row of rows)
      expect(row).toMatchObject({
        actor_account_id: operation.actor,
        family_id: accounts[0].family_id,
        target_account_id: operation.target,
        target_profile_id: null,
        metadata: {},
        occurred_at: expect.any(Date),
      });
  });

  it.each(cases)('TC-840: $name rollback cả nghiệp vụ lẫn audit khi commit thất bại', async ({ index }) => {
    const operation = (await prepare(t))[index]!;
    const before = await snapshot(t);
    // Trigger hoãn đến commit: INSERT audit đã chạy trước khi giao dịch bị huỷ.
    await t.owner.query(`CREATE FUNCTION public.reject_audit_commit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'Lỗi commit thử'; END $$;
      CREATE CONSTRAINT TRIGGER reject_audit_commit AFTER INSERT ON admin_audit_events
      DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.reject_audit_commit()`);
    try {
      await expect(operation.run()).rejects.toThrow();
    } finally {
      await t.owner.query(
        'DROP TRIGGER reject_audit_commit ON admin_audit_events; DROP FUNCTION public.reject_audit_commit()',
      );
    }
    expect(await snapshot(t)).toEqual(before);
  });
});
