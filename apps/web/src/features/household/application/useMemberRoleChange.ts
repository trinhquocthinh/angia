import { useRef, useState } from 'react';
import { memberActionError } from './memberActionError';
import type { ChangeMemberRole, HouseholdMemberRole, MemberActionOutcome } from './memberPorts';

export function useMemberRoleChange(action: ChangeMemberRole, csrfToken: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);

  async function changeRole(
    targetAccountId: string,
    role: HouseholdMemberRole,
    displayName: string,
  ): Promise<MemberActionOutcome> {
    if (locked.current || !csrfToken) return { status: 'ignored' };
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await action(targetAccountId, role, csrfToken);
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

  return { pending, error, clearError: () => setError(null), changeRole };
}
