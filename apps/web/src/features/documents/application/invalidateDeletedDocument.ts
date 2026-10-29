import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { FAMILY_USAGE_KEY } from './useFamilyUsage';

export async function invalidateDeletedDocument(
  client: QueryClient,
  session: ProfileSession,
  documentId: string,
  profileId: string,
) {
  const review = ['review', session.account.id, session.family?.id];
  const detail = [...review, 'document', documentId];
  await client.cancelQueries({ queryKey: detail, exact: true });
  client.removeQueries({ queryKey: detail, exact: true });
  client.removeQueries({
    queryKey: ['document-deletion-impact', session.account.id, session.family?.id, documentId],
  });
  const scope = [session.account.id, session.family?.id, profileId];
  await Promise.all([
    client.invalidateQueries({ queryKey: [...review, 'queue'] }),
    client.invalidateQueries({ queryKey: FAMILY_USAGE_KEY }),
    ...['documents', 'medications', 'measurements', 'lab-results', 'visit-summary'].map((name) =>
      client.invalidateQueries({ queryKey: [name, ...scope] }),
    ),
  ]);
}
