import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';

export function invalidatePrescriptionData(
  client: QueryClient,
  session: ProfileSession | null | undefined,
  profileId?: string,
) {
  return client.invalidateQueries({
    queryKey: [
      'prescriptions',
      session?.account.id ?? null,
      session?.family?.id ?? null,
      ...(profileId ? [profileId] : []),
    ],
  });
}
