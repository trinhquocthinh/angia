import { and, desc, eq, sql } from 'drizzle-orm';
import { familyInvitations } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ManagedHouseholdInvitation, ScopedInvitationActor } from '../application/invitationPorts.js';
import { lockInvitationActor } from './lockInvitationActor.js';
import type { InvitationSecretCipher } from './invitationSecretCipher.js';
export async function listStoredHouseholdInvitations(
  tx: FamilyScopedTx,
  actor: ScopedInvitationActor,
  offset: number,
  cipher: InvitationSecretCipher,
) {
  const access = await lockInvitationActor(tx, actor);
  if (!access.ok) return access;
  if (access.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const rows = await tx
    .select({
      invitationId: familyInvitations.id,
      role: familyInvitations.role,
      createdAt: familyInvitations.createdAt,
      expiresAt: familyInvitations.expiresAt,
      createdBy: familyInvitations.createdBy,
      secret: familyInvitations.secretCiphertext,
      status: sql<ManagedHouseholdInvitation['status']>`CASE
    WHEN ${familyInvitations.acceptedAt} IS NOT NULL THEN 'accepted'
    WHEN ${familyInvitations.revokedAt} IS NOT NULL THEN 'revoked'
    WHEN ${familyInvitations.expiresAt}<=clock_timestamp() THEN 'expired' ELSE 'active' END`,
    })
    .from(familyInvitations)
    .where(and(eq(familyInvitations.familyId, actor.familyId), eq(familyInvitations.kind, 'join_family')))
    .orderBy(desc(familyInvitations.createdAt), desc(familyInvitations.id))
    .limit(51)
    .offset(offset);
  const items = rows.slice(0, 50).map((row) => {
    const own = row.createdBy === actor.accountId;
    let secrets = null;
    if (own && row.status === 'active' && row.secret) {
      try {
        secrets = cipher.open(actor.familyId, row.invitationId, row.secret);
      } catch {
        /* Chỉ trả metadata, cho phép thu hồi/thay khi khóa không còn khớp. */
      }
    }
    return {
      invitationId: row.invitationId,
      role: row.role as 'main' | 'member',
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      status: row.status,
      own,
      secrets,
    };
  });
  return { ok: true, value: { items, hasMore: rows.length > 50 } } as const;
}
