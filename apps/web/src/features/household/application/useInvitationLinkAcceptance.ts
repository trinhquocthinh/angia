import { useRef, useState } from 'react';
import type { AcceptHouseholdInvitation } from './acceptInvitationPorts';
import { acceptInvitationErrorMessage } from './acceptInvitationErrorMessage';
import { clearPendingInvitation } from './pendingHouseholdInvitation';

type Options = {
  token: string | null;
  csrfToken: string;
  action: AcceptHouseholdInvitation;
  refresh: () => Promise<unknown>;
  enabled: boolean;
};
export function useInvitationLinkAcceptance({ token, csrfToken, action, refresh, enabled }: Options) {
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminal, setTerminal] = useState(false);
  const locked = useRef(false);
  const needsSession = useRef(false);
  const ended = useRef(false);
  async function recover() {
    try {
      await refresh();
    } catch {
      setError('Đã nhận lời mời. Chưa thể tải thông tin nhà. Vui lòng thử tải lại.');
    }
  }
  async function accept() {
    if (locked.current || ended.current || !csrfToken || (!needsSession.current && (!enabled || !token)))
      return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      if (needsSession.current) return await recover();
      const result = await action({ token: token! }, csrfToken);
      if (result.ok) {
        needsSession.current = true;
        setAccepted(true);
        clearPendingInvitation();
        await recover();
      } else {
        if (
          ['ERR_NOT_FOUND', 'ERR_ACCOUNT_ALREADY_IN_FAMILY', 'ERR_DELETION_PENDING'].includes(result.code)
        ) {
          clearPendingInvitation();
          ended.current = true;
          setTerminal(true);
        }
        setError(acceptInvitationErrorMessage(result.code, 'link'));
      }
    } catch {
      setError(acceptInvitationErrorMessage('NETWORK', 'link'));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return { accept, busy, accepted, error, terminal };
}
