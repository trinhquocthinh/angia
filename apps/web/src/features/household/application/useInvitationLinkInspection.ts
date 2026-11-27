import { useEffect, useRef, useState } from 'react';
import type { InspectHouseholdInvitation, InvitationInspection } from './inspectInvitationPorts';
import { clearPendingInvitation } from './pendingHouseholdInvitation';

type State =
  | { phase: 'inspecting' | 'error'; message?: string; canRetry?: boolean }
  | (InvitationInspection & { phase: InvitationInspection['kind'] });
export function useInvitationLinkInspection(
  token: string | null,
  hasFamily: boolean,
  inspect: InspectHouseholdInvitation,
) {
  const [state, setState] = useState<State>({ phase: 'inspecting' });
  const active = useRef(false);
  const locked = useRef(false);
  async function load() {
    if (!token || hasFamily || locked.current || !active.current) return;
    locked.current = true;
    setState({ phase: 'inspecting' });
    try {
      const result = await inspect({ token });
      if (!active.current) return;
      if (result.ok) setState({ ...result.data, phase: result.data.kind });
      else {
        const invalid = result.code === 'ERR_NOT_FOUND';
        if (invalid) clearPendingInvitation();
        setState({
          phase: 'error',
          canRetry: !invalid,
          message: invalid
            ? 'Lời mời không còn dùng được. Hãy nhờ người mời gửi link mới.'
            : result.code === 'ERR_RATE_LIMITED'
              ? 'Bạn thử quá nhiều lần. Vui lòng thử lại sau.'
              : 'Chưa thể kiểm tra lời mời. Vui lòng thử lại.',
        });
      }
    } catch {
      if (active.current)
        setState({ phase: 'error', canRetry: true, message: 'Chưa thể kiểm tra lời mời. Vui lòng thử lại.' });
    } finally {
      locked.current = false;
    }
  }
  useEffect(() => {
    active.current = true;
    if (hasFamily) clearPendingInvitation();
    queueMicrotask(() => void load());
    return () => {
      active.current = false;
    };
    // Token và các phụ thuộc giữ nguyên trong lần mở trang này.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hasFamily, inspect]);
  return { state, retry: () => (state.phase === 'error' && state.canRetry ? load() : Promise.resolve()) };
}
