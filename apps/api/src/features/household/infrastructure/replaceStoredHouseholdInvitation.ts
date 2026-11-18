import { and, eq, isNull, sql } from 'drizzle-orm';
import { familyInvitations, familyDeletionRequests } from '@src/shared/db/schema/index.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ScopedInvitationActor } from '../application/invitationPorts.js';
import { lockInvitationActor } from './lockInvitationActor.js';
import { writeHouseholdInvitation } from './writeHouseholdInvitation.js';
import type { InvitationSecretCipher } from './invitationSecretCipher.js';
export async function replaceStoredHouseholdInvitation(
  tx: FamilyScopedTx,
  actor: ScopedInvitationActor,
  id: string,
  cipher: InvitationSecretCipher,
) {
  const access = await lockInvitationActor(tx, actor);
  if (!access.ok) return access;
  if (access.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const [pending] = await tx
    .select({ id: familyDeletionRequests.id })
    .from(familyDeletionRequests)
    .where(
      and(eq(familyDeletionRequests.familyId, actor.familyId), eq(familyDeletionRequests.status, 'pending')),
    )
    .limit(1);
  if (pending) return { ok: false, code: 'ERR_DELETION_PENDING' } as const;
  const [old] = await tx
    .select({ role: familyInvitations.role, createdBy: familyInvitations.createdBy })
    .from(familyInvitations)
    .where(
      and(
        eq(familyInvitations.id, id),
        eq(familyInvitations.familyId, actor.familyId),
        eq(familyInvitations.kind, 'join_family'),
        isNull(familyInvitations.acceptedAt),
        isNull(familyInvitations.revokedAt),
        sql`${familyInvitations.expiresAt}>clock_timestamp()`,
      ),
    )
    .for('update');
  if (!old) return { ok: false, code: 'ERR_NOT_FOUND' } as const;
  if (old.createdBy !== actor.accountId || !old.role) return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const revoked = await tx
    .update(familyInvitations)
    .set({ revokedAt: sql`clock_timestamp()` })
    .where(
      and(
        eq(familyInvitations.familyId, actor.familyId),
        eq(familyInvitations.createdBy, actor.accountId),
        eq(familyInvitations.kind, 'join_family'),
        eq(familyInvitations.role, old.role),
        isNull(familyInvitations.acceptedAt),
        isNull(familyInvitations.revokedAt),
        sql`${familyInvitations.expiresAt}>clock_timestamp()`,
      ),
    )
    .returning({ id: familyInvitations.id });
  for (let i = 0; i < revoked.length; i++)
    await writeAdminAuditEvent(tx, {
      actorAccountId: actor.accountId,
      familyId: actor.familyId,
      action: 'invitation_revoked',
    });
  return writeHouseholdInvitation(tx, actor, old.role, cipher);
}
