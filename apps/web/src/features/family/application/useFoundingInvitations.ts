import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from './AdminRequestError';
import type { FoundingInvitation, FoundingInvitationRepository } from './ports';

// Bí mật chỉ ở state của trang, không đưa vào query/mutation cache hay browser storage.
export function useFoundingInvitations(repository: FoundingInvitationRepository, csrfToken: string | null) {
  const client = useQueryClient();
  const [session, setSession] = useState({ csrfToken, items: [] as FoundingInvitation[] });
  const [notice, setNotice] = useState('');
  if (session.csrfToken !== csrfToken) {
    setSession({ csrfToken, items: [] });
    setNotice('');
  }
  const refreshSession = async (error: Error) => {
    if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
      await client.invalidateQueries({ queryKey: ['current-session'] });
    }
  };
  const create = useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: async () => {
      if (!csrfToken) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      const issued = await repository.create(csrfToken);
      setSession((previous) =>
        previous.csrfToken !== csrfToken
          ? previous
          : {
              csrfToken,
              items: [...previous.items, issued],
            },
      );
      setNotice('');
    },
    onError: refreshSession,
  });
  const revoke = useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: async (id: string) => {
      if (!csrfToken) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      let missing = false;
      try {
        await repository.revoke(id, csrfToken);
      } catch (error) {
        if (!(error instanceof AdminRequestError) || error.code !== 'ERR_NOT_FOUND') throw error;
        missing = true;
      }
      setSession((previous) =>
        previous.csrfToken !== csrfToken
          ? previous
          : {
              csrfToken,
              items: previous.items.filter((item) => item.invitationId !== id),
            },
      );
      setNotice(missing ? 'Lời mời này không còn hiệu lực.' : 'Đã thu hồi lời mời.');
    },
    onError: refreshSession,
  });
  return { items: session.items, notice, create, revoke };
}
