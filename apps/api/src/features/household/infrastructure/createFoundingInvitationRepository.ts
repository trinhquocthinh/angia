import { newId } from '@src/shared/db/schema/newId.js';
import { randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts, adminAuditEvents } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { FoundingInvitationRepository } from '../application/acceptancePorts.js';
import { hashInvitationSecret } from './hashInvitationSecret.js';

async function lockAdmin(tx: FamilyScopedTx, id: string) {
  const [account] = await tx
    .select({ admin: accounts.isSystemAdmin, locked: accounts.lockedAt, family: accounts.familyId })
    .from(accounts)
    .where(eq(accounts.id, id))
    .for('update');
  return Boolean(account?.admin && !account.locked && !account.family);
}

export function createFoundingInvitationRepository(db: Database): FoundingInvitationRepository {
  return {
    create: (accountId) =>
      db.transaction(async (tx) => {
        if (!(await lockAdmin(tx, accountId))) return { ok: false, code: 'ERR_FORBIDDEN' };
        const token = randomBytes(32).toString('base64url');
        const code = randomBytes(6).toString('hex').toUpperCase();
        const { rows } = await tx.execute<{ id: string; expires_at: string }>(
          sql`SELECT id,expires_at FROM public.issue_founding_invitation(${accountId}::uuid, ${newId()}::uuid, ${hashInvitationSecret(token)}, ${hashInvitationSecret(code)})`,
        );
        const row = rows[0];
        if (!row) return { ok: false, code: 'ERR_FORBIDDEN' };
        await tx
          .insert(adminAuditEvents)
          .values({ actorAccountId: accountId, action: 'invitation_created', metadata: {} });
        return {
          ok: true,
          value: { invitationId: row.id, token, code, expiresAt: new Date(row.expires_at) },
        };
      }),
    revoke: (accountId, invitationId) =>
      db.transaction(async (tx) => {
        if (!(await lockAdmin(tx, accountId))) return { ok: false, code: 'ERR_FORBIDDEN' };
        const { rows } = await tx.execute<{ revoked: boolean }>(
          sql`SELECT public.revoke_founding_invitation(${accountId}::uuid, ${invitationId}::uuid) AS revoked`,
        );
        if (!rows[0]?.revoked) return { ok: false, code: 'ERR_NOT_FOUND' };
        await tx
          .insert(adminAuditEvents)
          .values({ actorAccountId: accountId, action: 'invitation_revoked', metadata: {} });
        return { ok: true };
      }),
  };
}
