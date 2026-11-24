import { useRef, useState } from 'react';
import { memberActionError } from './memberActionError';
import type { MemberPasswordResetOutcome, ResetMemberPassword, TemporaryPasswordResult } from './memberPorts';

function classifyError(code: string, message: string): MemberPasswordResetOutcome {
  if (code === 'ERR_NOT_FOUND') return { status: 'not_found', message };
  if (code === 'ERR_OWNER_PROTECTED') return { status: 'owner_protected', message };
  if (code === 'ERR_FORBIDDEN') return { status: 'forbidden', message };
  return { status: 'error', message };
}

export function useMemberPasswordReset(action: ResetMemberPassword, csrfToken: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TemporaryPasswordResult | null>(null);
  const locked = useRef(false);

  async function resetPassword(
    targetAccountId: string,
    displayName: string,
  ): Promise<MemberPasswordResetOutcome> {
    if (locked.current || !csrfToken) return { status: 'ignored' };
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const response = await action(targetAccountId, csrfToken);
      if (response.ok) {
        setResult(response.value);
        return { status: 'ok', value: response.value };
      }
      const message = memberActionError(response.code, displayName);
      setError(message);
      return classifyError(response.code, message);
    } catch {
      const message = memberActionError('NETWORK', displayName);
      setError(message);
      return { status: 'error', message };
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  function clearResult() {
    setResult(null);
    setError(null);
  }

  return { pending, error, result, clearError: () => setError(null), clearResult, resetPassword };
}
