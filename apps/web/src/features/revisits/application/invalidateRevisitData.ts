import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';

export async function invalidateRevisitData(
  client: QueryClient,
  session: ProfileSession | null | undefined,
  profileId?: string,
) {
  const scope = [session?.account.id ?? null, session?.family?.id ?? null];
  await Promise.all([
    client.invalidateQueries({ queryKey: ['revisits', ...scope, ...(profileId ? [profileId] : [])] }),
    client.invalidateQueries({ queryKey: ['my-revisit-reminder', ...scope] }),
  ]);
}
