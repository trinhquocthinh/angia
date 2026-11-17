import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { createInvitationVerifier } from './createInvitationVerifier.js';
import { createRegistrationGate } from './createRegistrationGate.js';
import { createLegalVersions } from './createLegalVersions.js';
import { RegistrationRejected } from './RegistrationRejected.js';
import type { NewLocalAccountRecord } from '../application/ports.js';

export async function checkRegistrationInvitation(tx: FamilyScopedTx, record: NewLocalAccountRecord) {
  const open = await createRegistrationGate(tx).isOpen();
  const invitation = record.invitationToken
    ? await createInvitationVerifier(tx).verify(record.invitationToken)
    : null;
  if (!open && !invitation) throw new RegistrationRejected({ ok: false, code: 'ERR_REGISTRATION_CLOSED' });
  if (record.invitationToken && !invitation)
    throw new RegistrationRejected({ ok: false, code: 'ERR_NOT_FOUND' });
  const current = await createLegalVersions(tx).current();
  if (
    current.termsVersionId !== record.legalAcceptance.termsVersionId ||
    current.privacyVersionId !== record.legalAcceptance.privacyVersionId
  )
    throw new RegistrationRejected({ ok: false, code: 'ERR_LEGAL_VERSION_OUTDATED', details: { current } });
  return invitation;
}
