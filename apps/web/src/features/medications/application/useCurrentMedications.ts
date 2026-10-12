import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { MedicationCatalogRepository } from './catalogPorts';
import { MedicationRequestError } from './MedicationRequestError';
// Khóa nằm dưới tiền tố ['medications', tài khoản, gia đình, hồ sơ] để khai báo/dừng thuốc làm mới danh mục.
export function useCurrentMedications(
  repository: MedicationCatalogRepository,
  session: ProfileSession,
  profile: HealthProfile | undefined,
) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['medications', session.account.id, session.family?.id, profile?.id, 'current'],
    queryFn: ({ signal }) => repository.current(profile!.id, signal),
    enabled: session.role === 'main' && Boolean(session.family) && profile?.consentStatus === 'confirmed',
    retry: false,
  });
  useEffect(() => {
    if (
      query.error instanceof MedicationRequestError &&
      (query.error.status === 401 || query.error.status === 403)
    )
      void client.invalidateQueries({ queryKey: ['current-session'] });
  }, [client, query.error]);
  return query;
}
