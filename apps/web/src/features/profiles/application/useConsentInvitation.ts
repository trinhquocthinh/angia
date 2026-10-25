import { useEffect, useRef, useState } from 'react';
import type { InvitationDraft, InvitationReceipt, InvitationRepository } from './invitationPorts';
import { loadInvitation } from './loadInvitation';
import type { InvitationLoadState } from './loadInvitation';
import { respondToInvitation } from './respondToInvitation';
export function useConsentInvitation(repository: InvitationRepository, token: string | null) {
  const [loaded, setLoaded] = useState<InvitationLoadState | { state: 'loading' }>({
    state: token ? 'loading' : 'unavailable',
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
    if (!token) {
      return () => controller.abort();
    }
    void loadInvitation(repository, token, controller.signal, setLoaded);
    return () => controller.abort();
  }, [repository, token, retry]);
  const respond = async (body: InvitationDraft) => {
    const controller = lifecycle.current;
    if (
      !token ||
      !controller ||
      controller.signal.aborted ||
      sending.current ||
      receipt ||
      loaded.state !== 'ready' ||
      loaded.view.status !== 'pending'
    )
      return;
    sending.current = true;
    setPending(true);
    setError('');
    try {
      const result = await respondToInvitation(repository, token, body, controller.signal);
      if (!result || controller.signal.aborted) return;
      if (result.state === 'receipt') setReceipt(result.receipt);
      else if (result.state === 'unavailable') setLoaded({ state: 'unavailable' });
      else setError('Không thể gửi phản hồi. Vui lòng thử lại.');
    } finally {
      if (!controller.signal.aborted) {
        sending.current = false;
        setPending(false);
      }
    }
  };
  const reload = () => {
    setLoaded({ state: 'loading' });
    setError('');
    setRetry((value) => value + 1);
  };
  return { loaded, receipt, error, pending, respond, retry: reload };
}
