import { useRef, useState } from 'react';
import { privacyErrorMessage } from './privacyErrorMessage';
export function usePrivacyActionRunner(enabled: boolean) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const run = async (task: () => Promise<void>) => {
    if (locked.current || !enabled) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (failure) {
      setError(privacyErrorMessage(failure));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return { busy, error, run };
}
