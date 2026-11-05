import type { QueryClient } from '@tanstack/react-query';
import { AdminRequestError } from '@src/features/family/application/AdminRequestError';

export async function refreshAiRoutingSession(error: unknown, client: QueryClient): Promise<void> {
  if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
    await client.invalidateQueries({ queryKey: ['current-session'] });
  }
}
