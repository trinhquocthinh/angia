import type { Ref } from 'react';
import type { IssuedInvitation } from '../../application/invitationPorts';
import { InvitationShareActions } from './InvitationShareActions';
import { InvitationIcon } from './InvitationIcon';
import { InvitationInactiveActions } from './InvitationInactiveActions';

type Props = {
  invitation: IssuedInvitation;
  active: boolean;
  pending: boolean;
  newButtonRef: Ref<HTMLButtonElement>;
  onNew: () => void;
  onRevoke: () => void;
};
export function InvitationIssuedActions({
  invitation,
  active,
  pending,
  newButtonRef,
  onNew,
  onRevoke,
}: Props) {
  if (active && !invitation.code)
    return (
      <>
        <p>Mã cũ không thể xem lại</p>
        <button
          type="button"
          className="household-invite-revoke-trigger"
          disabled={pending}
          onClick={onRevoke}
        >
          Thu hồi lời mời
        </button>
      </>
    );
  if (!active)
    return <InvitationInactiveActions newButtonRef={newButtonRef} pending={pending} onNew={onNew} />;
  return (
    <>
      <InvitationShareActions invitation={invitation} disabled={pending} />
      <button
        type="button"
        className="household-invite-revoke-trigger"
        onClick={(event) => {
          event.currentTarget.focus();
          onRevoke();
        }}
      >
        <InvitationIcon name="trash" />
        Thu hồi lời mời
      </button>
    </>
  );
}
