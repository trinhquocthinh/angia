import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ListInvitations } from './managedInvitationPorts';
export function useManagedHouseholdInvitations(list: ListInvitations, scope: string) {
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ['household-invitations', scope, offset],
    gcTime: 0,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const result = await list(offset);
      if (!result.ok) throw new Error('Chưa thể tải lời mời. Vui lòng thử lại.');
      return result.value;
    },
  });
  return {
    query,
    offset,
    previous: () => setOffset(Math.max(0, offset - 50)),
    next: () => setOffset(offset + 50),
  };
}
