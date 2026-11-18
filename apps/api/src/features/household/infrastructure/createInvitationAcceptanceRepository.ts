import { eq } from 'drizzle-orm';
import type { Database } from '@src/shared/db/createDatabase.js';
import { accounts } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { checkHouseholdCreation } from './checkHouseholdCreation.js';
import type { InvitationAcceptanceRepository } from '../application/acceptancePorts.js';
import { hashInvitationSecret } from './hashInvitationSecret.js';
import { lookupJoinInvitation } from './lookupJoinInvitation.js';
import { acceptStoredJoinInvitation } from './acceptStoredJoinInvitation.js';

export function createInvitationAcceptanceRepository(db: Database): InvitationAcceptanceRepository {
  return {
    accept: (accountId, token) =>
      db.transaction(
        async (tx) => {
          const failure = await checkHouseholdCreation(tx, accountId);
          if (failure) return failure;
          const [account] = await tx
            .select({ admin: accounts.isSystemAdmin })
            .from(accounts)
            .where(eq(accounts.id, accountId));
          if (account?.admin) return { ok: false, code: 'ERR_FORBIDDEN' };
          const digest = hashInvitationSecret(token);
          const invitation = await lookupJoinInvitation(tx, digest);
          if (!invitation) return { ok: false, code: 'ERR_NOT_FOUND' };
          // Scope lấy từ hash bí mật đã tra được, không nhận familyId từ DTO.
          return withFamilyScope(tx, invitation.family_id, (scoped) =>
            acceptStoredJoinInvitation(scoped, accountId, digest, invitation),
          );
        },
        { isolationLevel: 'read committed' },
      ),
  };
}
