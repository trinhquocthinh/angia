import { randomUUID } from 'node:crypto';
import type { ProfileTestApp } from './startProfileTestApp.js';
import { seedAccount, seedSession } from './seedAuthFixtures.js';

export function householdInvitationFixture(t: ProfileTestApp) {
  const waiting = async (admin = false) => seedSession(t.owner, await seedAccount(t.owner, { admin }));
  const issue = async (role = 'member') => {
    const familyId = await t.family();
    const creator = await t.session(familyId);
    const response = await t.call(creator, 'POST', '/api/family/invitations', { kind: 'join_family', role });
    if (response.status !== 201) throw new Error('Không tạo được lời mời thử');
    const value = (await response.json()) as { invitationId: string; link: string; code: string };
    const token = new URLSearchParams(new URL(value.link).hash.slice(1)).get('token')!;
    return { ...value, token, familyId, creator };
  };
  const accept = (user: Awaited<ReturnType<typeof waiting>>, token: string) =>
    t.call(user, 'POST', '/api/invitations/accept', { token });
  const state = async (id: string) =>
    (
      await t.owner.query('SELECT accepted_at,accepted_by,revoked_at FROM family_invitations WHERE id=$1', [
        id,
      ])
    ).rows[0];
  const membership = async (id: string) =>
    (await t.owner.query('SELECT family_id,family_role,health_profile_id FROM accounts WHERE id=$1', [id]))
      .rows[0];
  const audits = async (id: string) =>
    (
      await t.owner.query(
        "SELECT action,metadata FROM admin_audit_events WHERE actor_account_id=$1 AND action='invitation_accepted'",
        [id],
      )
    ).rows;
  const pendingDeletion = async (familyId: string, accountId: string) =>
    t.owner.query(
      "INSERT INTO family_deletion_requests(id,family_id,requested_by,execute_at) VALUES($1,$2,$3,now()+interval '30 days')",
      [randomUUID(), familyId, accountId],
    );
  return { waiting, issue, accept, state, membership, audits, pendingDeletion };
}
