import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { familyInvitations } from '@src/shared/db/schema/index.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ScopedInvitationActor } from '../application/invitationPorts.js';
import type { InvitationSecretCipher } from './invitationSecretCipher.js';
export async function writeHouseholdInvitation(
  tx: FamilyScopedTx,
  actor: ScopedInvitationActor,
  role: 'main' | 'member',
  cipher: InvitationSecretCipher,
) {
  const token = randomBytes(32).toString('base64url');
  const code = randomBytes(6).toString('hex').toUpperCase();
  const hash = (s: string) => createHash('sha256').update(s).digest('hex');
  const {
    rows: [clock],
  } = await tx.execute<{ at: string }>(sql`SELECT clock_timestamp() AS at`);
  if (!clock) throw new Error('Không đọc được thời gian DB');
  const createdAt = new Date(clock.at);
  const expiresAt = new Date(createdAt.getTime() + 604800000);
  const invitationId = randomUUID();
  const secretCiphertext = cipher.seal(actor.familyId, invitationId, { token, code });
  await tx.insert(familyInvitations).values({
    id: invitationId,
    kind: 'join_family',
    familyId: actor.familyId,
    role,
    tokenHash: hash(token),
    codeHash: hash(code),
    createdBy: actor.accountId,
    createdAt,
    expiresAt,
    secretCiphertext,
  });
  await writeAdminAuditEvent(tx, {
    actorAccountId: actor.accountId,
    familyId: actor.familyId,
    action: 'invitation_created',
  });
  return { ok: true, value: { invitationId, token, code, expiresAt } } as const;
}
