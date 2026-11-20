import type { QueryClient } from '@tanstack/react-query';
import { CURRENT_SESSION_KEY } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';

export async function refreshSession(client: QueryClient) {
  await client.cancelQueries({ queryKey: CURRENT_SESSION_KEY });
  const current = await fetchCurrentSession();
  client.setQueryData(CURRENT_SESSION_KEY, current);
  return current;
}
