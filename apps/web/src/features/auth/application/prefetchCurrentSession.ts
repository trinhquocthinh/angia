import type { QueryClient } from '@tanstack/react-query';
import { CURRENT_SESSION_KEY, type FetchCurrentSession } from './useCurrentSession';

/**
 * NFR-1: gọi `/api/me` song song với việc tải chunk route thay vì chờ router render AuthBoundary.
 * AuthBoundary vẫn kiểm tra lại khi mount (`refetchOnMount: 'always'`); lỗi do AuthBoundary hiển thị.
 */
export const prefetchCurrentSession = (client: QueryClient, fetchCurrentSession: FetchCurrentSession) =>
  client.prefetchQuery({
    queryKey: CURRENT_SESSION_KEY,
    queryFn: ({ signal }) => fetchCurrentSession(signal),
    retry: false,
  });
