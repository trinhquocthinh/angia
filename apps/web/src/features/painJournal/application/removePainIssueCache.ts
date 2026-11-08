import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
export async function removePainIssueCache(
  client: QueryClient,
  session: ProfileSession,
  profileId: string,
  issueId: string,
) {
  const filters = {
    predicate: ({ queryKey: k }: { queryKey: readonly unknown[] }) =>
      k[0] === 'profiles' &&
      k[1] === session.account.id &&
      k[2] === session.family?.id &&
      k[3] === 'pain' &&
      k[5] === profileId &&
      k[7] === issueId,
  };
  await client.cancelQueries(filters);
  client.removeQueries(filters);
}
