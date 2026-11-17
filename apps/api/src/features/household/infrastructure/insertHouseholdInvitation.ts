import { createHash, randomBytes } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import { adminAuditEvents, familyDeletionRequests, familyInvitations } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { HouseholdInvitationRepository } from '../application/invitationPorts.js';
import { lockInvitationActor } from './lockInvitationActor.js';

type Actor = Parameters<HouseholdInvitationRepository['create']>[0];

export async function insertHouseholdInvitation(
  tx: FamilyScopedTx,
  actor: Actor,
  role: 'main' | 'member',
): ReturnType<HouseholdInvitationRepository['create']> {
  const access = await lockInvitationActor(tx, actor);
  if (!access.ok) return access;
  if (access.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' };
  const [pending] = await tx
    .select({ id: familyDeletionRequests.id })
    .from(familyDeletionRequests)
    .where(
      and(eq(familyDeletionRequests.familyId, actor.familyId), eq(familyDeletionRequests.status, 'pending')),
    )
    .limit(1);
  if (pending) return { ok: false, code: 'ERR_DELETION_PENDING' };
  const token = randomBytes(32).toString('base64url');
  const code = randomBytes(6).toString('hex').toUpperCase();
  const hash = (value: string) => createHash('sha256').update(value).digest('hex');
  const {
    rows: [clock],
  } = await tx.execute<{ at: string }>(sql`SELECT clock_timestamp() AS at`);
  if (!clock) throw new Error('Không đọc được thời gian DB');
  const createdAt = new Date(clock.at);
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [invitation] = await tx
    .insert(familyInvitations)
    .values({
      kind: 'join_family',
      familyId: actor.familyId,
      role,
      tokenHash: hash(token),
      codeHash: hash(code),
      createdBy: actor.accountId,
      createdAt,
      expiresAt,
    })
    .returning({ id: familyInvitations.id });
  if (!invitation) throw new Error('INSERT lời mời không trả về ID');
  await tx.insert(adminAuditEvents).values({
    actorAccountId: actor.accountId,
    familyId: actor.familyId,
    action: 'invitation_created',
    metadata: {},
  });
  return { ok: true, value: { invitationId: invitation.id, token, code, expiresAt } };
}
