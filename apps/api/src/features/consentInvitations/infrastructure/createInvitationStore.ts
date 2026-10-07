import { recordInvitationResponse } from './recordInvitationResponse.js';
import { and, eq, isNull } from 'drizzle-orm';
import { accounts, consentInvitations, healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { InvitationStore } from '../application/ports.js';

// Làm việc trong withFamilyScope; luôn khóa hồ sơ trước lời mời.
export function createInvitationStore(tx: FamilyScopedTx, familyId: string): InvitationStore {
  const profileWhere = (id: string) => and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId));
  const invitationWhere = (id: string) =>
    and(eq(consentInvitations.id, id), eq(consentInvitations.familyId, familyId));
  return {
    lockProfile: async (id) =>
      (await tx.select().from(healthProfiles).where(profileWhere(id)).for('update'))[0] ?? null,
    lockInvitation: async (claims) =>
      (
        await tx
          .select()
          .from(consentInvitations)
          .where(
            and(invitationWhere(claims.invitationId), eq(consentInvitations.profileId, claims.profileId)),
          )
          .for('update')
      )[0] ?? null,
    inviterName: async (id) =>
      id
        ? ((
            await tx
              .select({ name: accounts.displayName })
              .from(accounts)
              .where(and(eq(accounts.id, id), eq(accounts.familyId, familyId)))
          )[0]?.name ?? null)
        : null,
    revokePending: async (profileId, at) => {
      await tx
        .update(consentInvitations)
        .set({ revokedAt: at })
        .where(
          and(
            eq(consentInvitations.profileId, profileId),
            eq(consentInvitations.familyId, familyId),
            isNull(consentInvitations.decision),
            isNull(consentInvitations.revokedAt),
          ),
        );
    },
    insertInvitation: async (invitation) => {
      await tx.insert(consentInvitations).values(invitation);
    },
    setStatus: async (profileId, consentStatus) => {
      await tx.update(healthProfiles).set({ consentStatus }).where(profileWhere(profileId));
    },
    recordResponse: (invitation, response, at) =>
      recordInvitationResponse(tx, familyId, invitation, response, at),
  };
}
