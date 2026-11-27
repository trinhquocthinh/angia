import { useState } from 'react';
import type { AcceptHouseholdInvitation } from './acceptInvitationPorts';
import type { InspectHouseholdInvitation } from './inspectInvitationPorts';
import { clearPendingInvitation, readPendingInvitation } from './pendingHouseholdInvitation';
import { acceptInvitationErrorMessage } from './acceptInvitationErrorMessage';
import { useInvitationLinkInspection } from './useInvitationLinkInspection';
import { useInvitationLinkAcceptance } from './useInvitationLinkAcceptance';

type Options = {
  hasFamily: boolean;
  csrfToken: string;
  inspect: InspectHouseholdInvitation;
  accept: AcceptHouseholdInvitation;
  refresh: () => Promise<unknown>;
  leave: () => Promise<unknown>;
};
export function useHouseholdInvitationLink(options: Options) {
  const [token] = useState(readPendingInvitation());
  const inspection = useInvitationLinkInspection(token, options.hasFamily, options.inspect);
  const acceptance = useInvitationLinkAcceptance({
    token,
    csrfToken: options.csrfToken,
    action: options.accept,
    refresh: options.refresh,
    enabled: !options.hasFamily && inspection.state.phase === 'join_family',
  });
  const phase = !token
    ? 'missing'
    : options.hasFamily
      ? 'already-member'
      : acceptance.terminal
        ? 'error'
        : inspection.state.phase;
  const message = !token
    ? 'Không tìm thấy lời mời. Hãy mở lại link mời bạn nhận được.'
    : options.hasFamily
      ? acceptInvitationErrorMessage('ERR_ACCOUNT_ALREADY_IN_FAMILY')
      : (acceptance.error ?? ('message' in inspection.state ? inspection.state.message : null));
  async function decline() {
    clearPendingInvitation();
    await options.leave();
  }
  return {
    ...acceptance,
    phase,
    message,
    decline,
    invitationToken: token,
    role: 'role' in inspection.state ? inspection.state.role : undefined,
    canRetry: !acceptance.terminal && 'canRetry' in inspection.state && inspection.state.canRetry,
    retry: inspection.retry,
  };
}
