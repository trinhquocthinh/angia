import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { familyInvitations } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdInvitationRepository } from '../application/invitationPorts.js';
import { lockInvitationActor } from './lockInvitationActor.js';

type Actor = Parameters<HouseholdInvitationRepository['revoke']>[0];

export async function revokeStoredHouseholdInvitation(
  tx: FamilyScopedTx,
  actor: Actor,
  invitationId: string,
): ReturnType<HouseholdInvitationRepository['revoke']> {
  const access = await lockInvitationActor(tx, actor);
  if (!access.ok) return access;
  const [invitation] = await tx
    .select({ id: familyInvitations.id, createdBy: familyInvitations.createdBy })
    .from(familyInvitations)
    .where(
      and(
        eq(familyInvitations.id, invitationId),
        eq(familyInvitations.familyId, actor.familyId),
        eq(familyInvitations.kind, 'join_family'),
      ),
    )
    .for('update');
  if (!invitation) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (access.role !== 'main' && invitation.createdBy !== actor.accountId)
    return { ok: false, code: 'ERR_FORBIDDEN' };
  const [revoked] = await tx
    .update(familyInvitations)
    .set({ revokedAt: sql`clock_timestamp()` })
    .where(
      and(
        eq(familyInvitations.id, invitationId),
        isNull(familyInvitations.revokedAt),
        isNull(familyInvitations.acceptedAt),
        sql`${familyInvitations.expiresAt} > clock_timestamp()`,
      ),
    )
    .returning({ id: familyInvitations.id });
  if (!revoked) return { ok: false, code: 'ERR_NOT_FOUND' };
  await writeAdminAuditEvent(tx, {
    actorAccountId: actor.accountId,
    familyId: actor.familyId,
    action: 'invitation_revoked',
  });
  return { ok: true };
}
