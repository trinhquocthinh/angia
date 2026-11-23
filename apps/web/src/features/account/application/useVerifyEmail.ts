import { useEffect, useRef, useState } from 'react';
import {
  mapEmailVerificationResult,
  type VerifyEmailState,
} from '@src/features/account/application/mapEmailVerificationResult';
import type { AccountResult, SubmitEmailVerificationConfirm } from '@src/features/account/application/ports';
import { parsePasswordResetToken } from '@src/features/account/application/readPasswordResetToken';
import { scrubPasswordResetHash } from '@src/features/account/application/scrubPasswordResetHash';

type PendingRequest = {
  key: string;
  promise: Promise<AccountResult<void>>;
};

export function useVerifyEmail(submitConfirm: SubmitEmailVerificationConfirm) {
  const [token] = useState<string | null>(() => parsePasswordResetToken(globalThis.location?.hash ?? ''));
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<VerifyEmailState>(() =>
    token ? { stage: 'verifying', error: null } : { stage: 'invalid', error: null },
  );
  // Giữ promise đang chạy theo khoá (token, lượt thử) để StrictMode không gửi trùng token một lần.
  const requestRef = useRef<PendingRequest | null>(null);

  useEffect(() => {
    scrubPasswordResetHash();
    if (!token) return;
    let active = true;
    const key = `${token}:${attempt}`;
    if (requestRef.current?.key !== key) {
      requestRef.current = { key, promise: submitConfirm({ token }) };
    }
    void requestRef.current.promise.then((result) => {
      if (!active) return;
      setState(mapEmailVerificationResult(result));
    });
    return () => {
      active = false;
    };
  }, [token, attempt, submitConfirm]);

  const retry = () => {
    if (!token) return;
    setState({ stage: 'verifying', error: null });
    setAttempt((current) => current + 1);
  };

  return { stage: state.stage, error: state.error, retry };
}
