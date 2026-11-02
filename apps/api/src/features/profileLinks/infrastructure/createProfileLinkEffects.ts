import { and, eq, isNull } from 'drizzle-orm';
import { consentInvitations, profileLinkEvents, reminderRecipients } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ProfileLinkStore } from '../application/ports.js';

// Hệ quả phụ của việc xác nhận link, cùng transaction với phần chính.
export function createProfileLinkEffects(
  tx: FamilyScopedTx,
  familyId: string,
): Pick<ProfileLinkStore, 'clearReminderRecipients' | 'revokeConsentInvitations' | 'recordLinkEvent'> {
  return {
    clearReminderRecipients: async (profileId) => {
      await tx
        .delete(reminderRecipients)
        .where(
          and(eq(reminderRecipients.familyId, familyId), eq(reminderRecipients.healthProfileId, profileId)),
        );
    },
    revokeConsentInvitations: async (profileId, at) => {
      await tx
        .update(consentInvitations)
        .set({ revokedAt: at })
        .where(
          and(
            eq(consentInvitations.familyId, familyId),
            eq(consentInvitations.profileId, profileId),
            isNull(consentInvitations.decision),
            isNull(consentInvitations.revokedAt),
          ),
        );
    },
    recordLinkEvent: async ({ at, ...event }) => {
      await tx.insert(profileLinkEvents).values({ familyId, ...event, createdAt: at });
    },
  };
}
