import type { ProfileListItem } from '@angia/contracts';
import type { listProfiles } from '../application/listProfiles.js';
import { toProfileResponse } from './toProfileResponse.js';

export function toProfileListItem(
  profile: Awaited<ReturnType<typeof listProfiles>>[number],
): ProfileListItem {
  return {
    ...toProfileResponse(profile),
    consentAction: profile.consentAction,
    hasLinkedAccount: profile.hasLinkedAccount,
    consentConfirmedByName: profile.consentConfirmedByName,
  };
}
