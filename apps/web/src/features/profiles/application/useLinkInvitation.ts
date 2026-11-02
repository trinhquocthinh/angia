import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { InvitationDecision, InvitationReceipt, InvitationRepository } from './invitationPorts';
import { loadInvitation } from './loadInvitation';
import type { InvitationLoadState } from './loadInvitation';
import { respondToInvitation } from './respondToInvitation';
// 'missing': quay về sau đăng nhập không có fragment; token không được lưu nên người dùng cần mở lại link (SPEC-040).
export function useLinkInvitation(repository: InvitationRepository, token: string | null, csrfToken: string) {
  const client = useQueryClient();
  const [loaded, setLoaded] = useState<InvitationLoadState | { state: 'loading' } | { state: 'missing' }>({
    state: token ? 'loading' : 'missing',
  });
  const [receipt, setReceipt] = useState<InvitationReceipt | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const sending = useRef(false);
  const lifecycle = useRef<AbortController | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    if (token) void loadInvitation(repository, token, controller.signal, setLoaded);
    return () => controller.abort();
  }, [repository, token, retry]);
  const reload = () => {
    setLoaded({ state: 'loading' });
    setError('');
    setRetry((value) => value + 1);
  };
  const respond = async (decision: InvitationDecision) => {
    const controller = lifecycle.current;
    if (!token || !controller || controller.signal.aborted || sending.current || receipt) return;
    if (loaded.state !== 'ready' || !loaded.view.canAccept) return;
    sending.current = true;
    setPending(true);
    setError('');
    try {
      const result = await respondToInvitation(repository, token, decision, csrfToken, controller.signal);
      if (!result || controller.signal.aborted) return;
      if (result.state === 'receipt') {
        setReceipt(result.receipt);
        await Promise.all([
          client.invalidateQueries({ queryKey: ['current-session'] }),
          client.invalidateQueries({ queryKey: ['profiles'] }),
        ]);
      } else if (result.state === 'unavailable') setLoaded({ state: 'unavailable' });
      else if (result.state === 'conflict') reload();
      else setError('Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      if (!controller.signal.aborted) {
        sending.current = false;
        setPending(false);
      }
    }
  };
  return { loaded, receipt, error, pending, respond, retry: reload };
}
