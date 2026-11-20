import { useRef, useState } from 'react';
import { guardianErrorMessage } from './guardianRules';
import type { GuardianMutationOutcome, GuardianResult } from './guardianPorts';

export function useGuardianMutation(csrfToken: string, refresh: () => Promise<void>) {
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  async function run(request: () => Promise<GuardianResult<void>>): Promise<GuardianMutationOutcome> {
    if (!csrfToken.trim() || busy.current) return { ok: false, message: guardianErrorMessage('UNKNOWN') };
    busy.current = true;
    setPending(true);
    try {
      const result = await request();
      if (!result.ok) return { ok: false, message: guardianErrorMessage(result.code) };
      await refresh();
      return { ok: true };
    } catch {
      return { ok: false, message: guardianErrorMessage('UNKNOWN') };
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { pending, run };
}
