import { useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from './AdminRequestError';
import type { AdminAuditQuery, AdminAuditRepository, AdminAuditResponse } from './ports';
export function useAdminAuditEvents(repository: AdminAuditRepository, accountId: string | null) {
  const client = useQueryClient();
  const [filters, setFilters] = useState({ query: { limit: 50 } as AdminAuditQuery, revision: 0 });
  const events = useInfiniteQuery({
    queryKey: ['admin', 'audit-events', accountId, filters],
    enabled: Boolean(accountId),
    retry: false,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page: AdminAuditResponse) => page.nextCursor ?? undefined,
    queryFn: async ({ signal, pageParam }) => {
      if (!accountId) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      try {
        return await repository.list(
          { ...filters.query, ...(pageParam ? { cursor: pageParam } : {}) },
          signal,
        );
      } catch (error) {
        if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403))
          await client.invalidateQueries({ queryKey: ['current-session'] });
        throw error;
      }
    },
  });
  // Mỗi lần Áp dụng/Xoá lọc bắt đầu lại trang đầu, kể cả bộ lọc đã có trong cache.
  const applyFilters = (query: AdminAuditQuery) =>
    setFilters((previous) => ({ query, revision: previous.revision + 1 }));
  return { events, applyFilters };
}
