import { useEffect, useRef, useState } from 'react';
import { useInvitationRevocation } from '../../application/useInvitationRevocation';
import { useInvitationExpiry } from '../../application/useInvitationExpiry';
import type { IssuedInvitation } from '../../application/invitationPorts';
import { householdInvitationRepository } from '../../infrastructure/householdInvitationRepository';
import { InvitationHeading } from './InvitationHeading';
import { InvitationRoleChoices } from './InvitationRoleChoices';
import { InvitationCodeCard } from './InvitationCodeCard';
import { InvitationIssuedActions } from './InvitationIssuedActions';
import { RevokeInvitationDialog } from './RevokeInvitationDialog';

type Props = {
  invitation: IssuedInvitation;
  csrfToken: string;
  onNew: () => void;
  serverStatus?: 'active' | 'accepted' | 'revoked' | 'expired' | undefined;
  onClosed?: () => void;
  pendingCreate?: boolean;
  embedded?: boolean;
};
export function InvitationIssuedView({
  invitation,
  csrfToken,
  onNew,
  serverStatus,
  onClosed,
  pendingCreate = false,
  embedded = false,
}: Props) {
  const revoker = useInvitationRevocation(householdInvitationRepository.revoke, csrfToken);
  const expired = useInvitationExpiry(invitation.expiresAt);
  const [confirm, setConfirm] = useState(false);
  const newButton = useRef<HTMLButtonElement>(null);
  const status =
    revoker.closed?.status ??
    (serverStatus === 'accepted'
      ? 'accepted'
      : serverStatus === 'revoked'
        ? 'revoked'
        : serverStatus === 'expired' || expired
          ? 'expired'
          : 'active');
  useEffect(() => {
    if (revoker.closed && !confirm) newButton.current?.focus();
  }, [revoker.closed, confirm]);
  async function revoke() {
    if (await revoker.revoke(invitation.invitationId)) {
      setConfirm(false);
      onClosed?.();
    }
  }
  return (
    <>
      {!embedded && (
        <>
          <InvitationHeading status={status} />
          <InvitationRoleChoices value={invitation.role} disabled onChange={() => undefined} />
        </>
      )}
      <InvitationCodeCard invitation={invitation} status={status} />
      <InvitationIssuedActions
        invitation={invitation}
        active={status === 'active'}
        pending={revoker.pending || pendingCreate}
        newButtonRef={newButton}
        onNew={onNew}
        onRevoke={() => setConfirm(true)}
      />
      {confirm && (status === 'active' || revoker.pending) && (
        <RevokeInvitationDialog
          invitation={invitation}
          pending={revoker.pending}
          error={revoker.error}
          onClose={() => setConfirm(false)}
          onConfirm={() => void revoke()}
        />
      )}
    </>
  );
}
