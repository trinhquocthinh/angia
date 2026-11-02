import { and, eq } from 'drizzle-orm';
import { accounts, healthProfiles, profileLinkInvitations } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ProfileLinkStore } from '../application/ports.js';
import type { ProfileLinkClaims } from '../domain/ProfileLink.js';

// Phần đọc/khóa của store; khóa hồ sơ trước link để các luồng không khóa chéo.
export function createProfileLinkReads(
  tx: FamilyScopedTx,
  familyId: string,
): Pick<
  ProfileLinkStore,
  'lockProfile' | 'findLinkedAccount' | 'lockInvitation' | 'lockAccount' | 'accountName'
> {
  const profileWhere = (id: string) => and(eq(healthProfiles.id, id), eq(healthProfiles.familyId, familyId));
  const accountWhere = (id: string) => and(eq(accounts.id, id), eq(accounts.familyId, familyId));
  return {
    lockProfile: async (id) =>
      (
        await tx
          .select({
            id: healthProfiles.id,
            displayName: healthProfiles.displayName,
            consentStatus: healthProfiles.consentStatus,
            consentWithdrawnAt: healthProfiles.consentWithdrawnAt,
          })
          .from(healthProfiles)
          .where(profileWhere(id))
          .for('update')
      )[0] ?? null,
    findLinkedAccount: async (profileId) =>
      (
        await tx
          .select({ id: accounts.id })
          .from(accounts)
          .where(and(eq(accounts.familyId, familyId), eq(accounts.healthProfileId, profileId)))
      )[0] ?? null,
    lockInvitation: (claims) => lockInvitation(tx, familyId, claims),
    lockAccount: async (id) =>
      (
        await tx
          .select({
            id: accounts.id,
            displayName: accounts.displayName,
            healthProfileId: accounts.healthProfileId,
          })
          .from(accounts)
          .where(accountWhere(id))
          .for('update')
      )[0] ?? null,
    accountName: async (id) =>
      id
        ? ((await tx.select({ name: accounts.displayName }).from(accounts).where(accountWhere(id)))[0]
            ?.name ?? null)
        : null,
  };
}

async function lockInvitation(tx: FamilyScopedTx, familyId: string, claims: ProfileLinkClaims) {
  return (
    (
      await tx
        .select({
          id: profileLinkInvitations.id,
          familyId: profileLinkInvitations.familyId,
          profileId: profileLinkInvitations.profileId,
          tokenHash: profileLinkInvitations.tokenHash,
          invitedByAccountId: profileLinkInvitations.invitedByAccountId,
          expiresAt: profileLinkInvitations.expiresAt,
          revokedAt: profileLinkInvitations.revokedAt,
          acceptedAt: profileLinkInvitations.acceptedAt,
        })
        .from(profileLinkInvitations)
        .where(
          and(
            eq(profileLinkInvitations.id, claims.invitationId),
            eq(profileLinkInvitations.profileId, claims.profileId),
            eq(profileLinkInvitations.familyId, familyId),
          ),
        )
        .for('update')
    )[0] ?? null
  );
}
