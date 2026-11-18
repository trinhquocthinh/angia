import { withFamilyScope, type FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { hashInvitationSecret } from '@src/features/household/infrastructure/hashInvitationSecret.js';
import { lookupJoinInvitation } from '@src/features/household/infrastructure/lookupJoinInvitation.js';
import { acceptStoredJoinInvitation } from '@src/features/household/infrastructure/acceptStoredJoinInvitation.js';
import { RegistrationRejected } from './RegistrationRejected.js';

export async function acceptRegistrationInvitation(
  tx: FamilyScopedTx,
  accountId: string,
  token: string,
): Promise<string> {
  const digest = hashInvitationSecret(token);
  const invitation = await lookupJoinInvitation(tx, digest);
  if (!invitation) throw new RegistrationRejected({ ok: false, code: 'ERR_NOT_FOUND' });
  const result = await withFamilyScope(tx, invitation.family_id, (scoped) =>
    acceptStoredJoinInvitation(scoped, accountId, digest, invitation),
  );
  if (!result.ok) {
    if (result.code === 'ERR_DELETION_PENDING')
      throw new RegistrationRejected({ ok: false, code: result.code });
    throw new RegistrationRejected({ ok: false, code: 'ERR_NOT_FOUND' });
  }
  return result.familyId;
}
