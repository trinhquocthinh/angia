import { and, desc, eq, sql } from 'drizzle-orm';
import { familyInvitations as invitations } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { CurrentHouseholdInvitation, ScopedInvitationActor } from '../application/invitationPorts.js';
import { lockInvitationActor } from './lockInvitationActor.js';
import type { InvitationSecretCipher } from './invitationSecretCipher.js';
export async function readCurrentHouseholdInvitations(
  tx: FamilyScopedTx,
  actor: ScopedInvitationActor,
  cipher: InvitationSecretCipher,
) {
  const access = await lockInvitationActor(tx, actor);
  if (!access.ok) return access;
  if (access.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' } as const;
  const active = sql`${invitations.acceptedAt} IS NULL AND ${invitations.revokedAt} IS NULL AND ${invitations.expiresAt}>clock_timestamp()`;
  const rows = await tx
    .selectDistinctOn([invitations.role], {
      invitationId: invitations.id,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      secret: invitations.secretCiphertext,
      status: sql<
        CurrentHouseholdInvitation['status']
      >`CASE WHEN ${invitations.acceptedAt} IS NOT NULL THEN 'accepted'
   WHEN ${invitations.revokedAt} IS NOT NULL THEN 'revoked' WHEN ${invitations.expiresAt}<=clock_timestamp() THEN 'expired' ELSE 'active' END`,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.familyId, actor.familyId),
        eq(invitations.createdBy, actor.accountId),
        eq(invitations.kind, 'join_family'),
      ),
    )
    .orderBy(
      invitations.role,
      sql`CASE WHEN ${active} THEN 0 ELSE 1 END`,
      desc(invitations.createdAt),
      desc(invitations.id),
    );
  const value: CurrentHouseholdInvitation[] = rows.map(({ secret, ...row }) => {
    let code: string | null = null;
    let token: string | null = null;
    if (secret && (row.status === 'active' || row.status === 'expired'))
      try {
        const value = cipher.open(actor.familyId, row.invitationId, secret);
        code = value.code;
        if (row.status === 'active') token = value.token;
      } catch {
        /* Legacy hoặc khóa không khớp: vẫn cho thu hồi bằng ID. */
      }
    return { ...row, role: row.role as 'main' | 'member', code, token };
  });
  return { ok: true, value } as const;
}
