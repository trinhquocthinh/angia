import { and, eq, isNull } from 'drizzle-orm';
import { accounts, healthProfiles, profileLinkInvitations } from '@src/shared/db/schema/index.js';
import { createProfileLinkReads } from './createProfileLinkReads.js';
import { createProfileLinkEffects } from './createProfileLinkEffects.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ProfileLinkStore } from '../application/ports.js';

// Chạy trong withFamilyScope; mọi truy vấn lọc thêm theo familyId (phòng thủ theo chiều sâu).
export function createProfileLinkStore(tx: FamilyScopedTx, familyId: string): ProfileLinkStore {
  const profileWhere = (id: string) => and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId));
  const accountWhere = (id: string) => and(eq(accounts.id, id), eq(accounts.familyId, familyId));
  const pendingLinks = (profileId: string) =>
    and(
      eq(profileLinkInvitations.familyId, familyId),
      eq(profileLinkInvitations.profileId, profileId),
      isNull(profileLinkInvitations.revokedAt),
      isNull(profileLinkInvitations.acceptedAt),
    );
  return {
    ...createProfileLinkReads(tx, familyId),
    ...createProfileLinkEffects(tx, familyId),
    revokePending: async (profileId, at) => {
      await tx.update(profileLinkInvitations).set({ revokedAt: at }).where(pendingLinks(profileId));
    },
    insertInvitation: async (invitation) => {
      await tx.insert(profileLinkInvitations).values(invitation);
    },
    markDecided: async (invitationId, accountId, decision, at) => {
      await tx
        .update(profileLinkInvitations)
        .set({ decision, acceptedAt: at, acceptedByAccountId: accountId })
        .where(
          and(eq(profileLinkInvitations.id, invitationId), eq(profileLinkInvitations.familyId, familyId)),
        );
    },
    applyConsent: async (profileId, patch) => {
      await tx.update(healthProfiles).set(patch).where(profileWhere(profileId));
    },
    linkAccount: async (accountId, profileId) => {
      await tx.update(accounts).set({ healthProfileId: profileId }).where(accountWhere(accountId));
    },
  };
}
