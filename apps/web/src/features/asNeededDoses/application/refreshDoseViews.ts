import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';

export async function refreshDoseViews(client: QueryClient, session: ProfileSession, profileId: string) {
  const scope = [session.account.id, session.family?.id, profileId];
  const keys: unknown[][] = ['medications', 'as-needed-doses', 'timeline'].map((name) => [name, ...scope]);
  if (session.account.healthProfileId === profileId) {
    for (const name of ['medications', 'as-needed-doses', 'timeline'])
      keys.push([...selfProfileKey(session), name]);
  }
  await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}
