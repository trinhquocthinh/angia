import { useRef, useState } from 'react';
import { accountErrorMessage } from './accountErrorMessage';
import type { SubmitEmailVerificationRequest } from './ports';

type VerifyState = { busy: boolean; notice: string | null; error: string | null };
const idle: VerifyState = { busy: false, notice: null, error: null };

export function useEmailVerificationRequest(
  csrfToken: string,
  submit: SubmitEmailVerificationRequest,
  refresh: () => Promise<void>,
) {
  const [state, setState] = useState<VerifyState>(idle);
  const locked = useRef(false);
  async function request() {
    if (locked.current) return;
    locked.current = true;
    setState({ busy: true, notice: null, error: null });
    try {
      const result = await submit(csrfToken);
      if (!result.ok) {
        setState({ busy: false, notice: null, error: accountErrorMessage(result.code) });
      } else if ('alreadyVerified' in result.data) {
        setState(idle);
        await refresh();
      } else {
        setState({
          busy: false,
          notice: 'Đã gửi liên kết xác minh. Liên kết có hiệu lực 24 giờ.',
          error: null,
        });
      }
    } finally {
      locked.current = false;
    }
  }
  return { ...state, request, clear: () => setState(idle) };
}
