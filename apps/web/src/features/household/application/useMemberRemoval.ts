import { useRef, useState } from 'react';
import { memberActionError } from './memberActionError';
import type { MemberActionOutcome, RemoveMember } from './memberPorts';

export function useMemberRemoval(action: RemoveMember, csrfToken: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);

  async function remove(targetAccountId: string, displayName: string): Promise<MemberActionOutcome> {
    if (locked.current || !csrfToken) return { status: 'ignored' };
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await action(targetAccountId, csrfToken);
      if (result.ok) return { status: 'ok' };
      const message = memberActionError(result.code, displayName);
      setError(message);
      return result.code === 'ERR_NOT_FOUND'
        ? { status: 'not_found', message }
        : { status: 'error', message };
    } catch {
      const message = memberActionError('NETWORK', displayName);
      setError(message);
      return { status: 'error', message };
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  return { pending, error, clearError: () => setError(null), remove };
}
