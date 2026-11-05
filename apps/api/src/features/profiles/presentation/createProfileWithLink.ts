import type { CreateHealthProfileRequest, CreatedHealthProfile } from '@angia/contracts';
import { createProfileLink } from '@src/features/profileLinks/application/createProfileLink.js';
import type { ProfileLinkDependencies } from '@src/features/profileLinks/application/ports.js';
import { createProfile } from '../application/createProfile.js';
import type { Clock, ProfileRepository } from '../application/ports.js';
import { toProfileResponse } from './toProfileResponse.js';

type Session = { familyId: string; accountId: string };
type Outcome =
  | { ok: true; value: CreatedHealthProfile }
  | {
      ok: false;
      code:
        | 'ERR_NOT_FOUND'
        | 'ERR_PROFILE_ALREADY_LINKED'
        | 'ERR_VALIDATION'
        | 'ERR_CONSENT_REQUIRED'
        | 'ERR_CONFIRMATION_MISMATCH'
        | 'ERR_CONSENT_INVITATION_REQUIRED';
    };

// SPEC-004 (E14): liên kết tài khoản khác thì hồ sơ ở pending và main nhận link để gửi cho tài khoản đó tự xác nhận.
export async function createProfileWithLink(
  repository: ProfileRepository,
  links: ProfileLinkDependencies,
  session: Session,
  input: CreateHealthProfileRequest,
  now: Clock,
): Promise<Outcome> {
  const result = await createProfile(repository, session.familyId, input, now, session.accountId);
  if (!result.ok) return result;
  const profile = toProfileResponse(result.value);
  if (!input.linkedAccountId || input.linkedAccountId === session.accountId)
    return { ok: true, value: profile };
  const link = await createProfileLink(links, session.familyId, result.value.id, session.accountId);
  if (!link.ok) return link;
  const linkInvitation = { url: link.value.url, expiresAt: link.value.expiresAt.toISOString() };
  return { ok: true, value: { ...profile, linkInvitation } };
}
