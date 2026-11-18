import { and, eq, isNull, sql } from 'drizzle-orm';
import { familyDeletionRequests, familyInvitations } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ScopedInvitationActor } from '../application/invitationPorts.js';
import { lockInvitationActor } from './lockInvitationActor.js';
import { writeHouseholdInvitation } from './writeHouseholdInvitation.js';
import type { InvitationSecretCipher } from './invitationSecretCipher.js';
export async function insertHouseholdInvitation(
  tx: FamilyScopedTx,
  actor: ScopedInvitationActor,
  role: 'main' | 'member',
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
  const [existing] = await tx
    .select({
      id: familyInvitations.id,
      expiresAt: familyInvitations.expiresAt,
      secret: familyInvitations.secretCiphertext,
    })
    .from(familyInvitations)
    .where(
      and(
        eq(familyInvitations.familyId, actor.familyId),
        eq(familyInvitations.createdBy, actor.accountId),
        eq(familyInvitations.kind, 'join_family'),
        eq(familyInvitations.role, role),
        isNull(familyInvitations.acceptedAt),
        isNull(familyInvitations.revokedAt),
        sql`${familyInvitations.expiresAt}>clock_timestamp()`,
      ),
    )
    .orderBy(familyInvitations.createdAt)
    .limit(1)
    .for('update');
  if (existing) {
    if (!existing.secret) return { ok: false, code: 'ERR_INVITATION_EXISTS' } as const;
    const secrets = cipher.open(actor.familyId, existing.id, existing.secret);
    return {
      ok: true,
      value: { invitationId: existing.id, expiresAt: existing.expiresAt, ...secrets },
    } as const;
  }
  return writeHouseholdInvitation(tx, actor, role, cipher);
}
