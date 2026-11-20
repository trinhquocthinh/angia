import { useRef, useState } from 'react';
import { householdHomeError, type HouseholdHomeErrorContext } from './householdHomeError';
import type { HomeActionOutcome, HomeResult } from './householdHomePorts';

/** Khoá gửi trùng và chuẩn hoá lỗi cho các thao tác quản lý nhà. */
export function useHouseholdHomeAction(context: HouseholdHomeErrorContext, csrfToken: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const locked = useRef(false);
  function clearError() {
    setError(null);
    setErrorCode(null);
  }
  async function run<T>(task: () => Promise<HomeResult<T>>): Promise<HomeActionOutcome> {
    if (locked.current || !csrfToken) return { status: 'ignored' };
    locked.current = true;
    setPending(true);
    clearError();
    try {
      const result = await task();
      if (result.ok) return { status: 'ok' };
      const message = householdHomeError(result.error, context);
      setError(message);
      setErrorCode(result.error.code);
      return { status: 'error', code: result.error.code, message };
    } catch {
      const message = householdHomeError({ code: 'NETWORK' }, context);
      setError(message);
      setErrorCode('NETWORK');
      return { status: 'error', code: 'NETWORK', message };
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return { pending, error, errorCode, clearError, run };
}
