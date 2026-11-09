import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
export async function refreshPainIssueViews(client: QueryClient, session: ProfileSession, profileId: string) {
  await Promise.all([
    client.invalidateQueries({
      predicate: ({ queryKey: key }) =>
        key[0] === 'profiles' &&
        key[1] === session.account.id &&
        key[2] === session.family?.id &&
        key[3] === 'pain' &&
        key[5] === profileId,
    }),
    client.invalidateQueries({ queryKey: ['timeline', session.account.id, session.family?.id, profileId] }),
    client.invalidateQueries({ queryKey: [...selfProfileKey(session), 'timeline'] }),
  ]);
}
