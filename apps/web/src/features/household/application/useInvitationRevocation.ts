import { useRef, useState } from 'react';
import { invitationErrorMessage } from './invitationErrorMessage';
import type { RevokeInvitation } from './invitationPorts';

export function useInvitationRevocation(action: RevokeInvitation, csrfToken: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState<{ id: string; status: 'revoked' | 'unavailable' } | null>(null);
  const locked = useRef(false);
  async function revoke(id: string) {
    if (locked.current || !csrfToken) return false;
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await action(id, csrfToken);
      if (result.ok || result.code === 'ERR_NOT_FOUND') {
        setClosed({ id, status: result.ok ? 'revoked' : 'unavailable' });
        return true;
      }
      setError(invitationErrorMessage(result.code));
    } catch {
      setError(invitationErrorMessage('NETWORK'));
    } finally {
      locked.current = false;
      setPending(false);
    }
    return false;
  }
  return { pending, error, closed, revoke };
}
