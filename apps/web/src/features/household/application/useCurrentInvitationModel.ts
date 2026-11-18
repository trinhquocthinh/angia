import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CurrentInvitationRepository, CurrentInvitations } from './currentInvitationPorts';
import type { InvitationRole } from './invitationPorts';
import { invitationErrorMessage } from './invitationErrorMessage';
export function useCurrentInvitationModel(
  repository: CurrentInvitationRepository,
  csrf: string,
  scope: string,
) {
  const client = useQueryClient();
  const key = ['current-household-invitations', scope];
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: key,
    gcTime: 0,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const result = await repository.current();
      if (!result.ok) throw new Error('Chưa thể tải lời mời.');
      return result.value;
    },
  });
  async function create(role: InvitationRole) {
    if (locked.current || !csrf) return;
    const existing = client.getQueryData<CurrentInvitations>(key)?.items.find((item) => item.role === role);
    if (existing?.status === 'active' && Date.parse(existing.expiresAt) > Date.now()) return;
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await repository.create({ kind: 'join_family', role }, csrf);
      if (result.ok)
        client.setQueryData<CurrentInvitations>(key, (old) => ({
          items: [
            ...(old?.items ?? []).filter((item) => item.role !== role),
            { ...result.value, role, status: 'active' },
          ],
        }));
      else setError(invitationErrorMessage(result.code));
    } catch {
      setError(invitationErrorMessage('NETWORK'));
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return { query, create, pending, error };
}
