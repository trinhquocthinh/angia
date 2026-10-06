import { and, eq } from 'drizzle-orm';
import { consentInvitations, healthProfiles } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { Invitation, InvitationResponse } from '../domain/Invitation.js';

// Cùng transaction đang giữ khóa hồ sơ và lời mời: cả hai bản ghi commit nguyên tử.
export async function recordInvitationResponse(
  tx: FamilyScopedTx,
  familyId: string,
  invitation: Invitation,
  response: InvitationResponse,
  at: Date,
): Promise<void> {
  await tx
    .update(consentInvitations)
    .set({ ...response, respondedAt: at })
    .where(and(eq(consentInvitations.id, invitation.id), eq(consentInvitations.familyId, familyId)));
  await tx
    .update(healthProfiles)
    .set(
      response.decision === 'accepted'
        ? {
            consentStatus: 'confirmed',
            consentSource: 'invitation',
            consentConfirmedAt: at,
            consentConfirmedBy: null,
            consentRespondentName: response.respondentName,
            consentBasis: response.basis,
          }
        : { consentStatus: 'declined' },
    )
    .where(and(eq(healthProfiles.id, invitation.profileId), eq(healthProfiles.familyId, familyId)));
}
