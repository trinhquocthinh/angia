import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { SelfProfileRepository } from './ports';
import { selfProfileKey } from './selfProfileKey';

// SPEC-042: tóm tắt hồ sơ liên kết; 404 nghĩa là phiên đang giữ đã cũ (vừa bị gỡ hoặc chuyển liên kết).
export function useSelfProfile(repository: SelfProfileRepository, session: ProfileSession) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...selfProfileKey(session), 'summary'],
    enabled: Boolean(session.account.healthProfileId),
    retry: false,
    queryFn: ({ signal }) => repository.profile(signal),
  });
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && [401, 403, 404].includes(query.error.status))
      void client.invalidateQueries({ queryKey: ['current-session'] });
  }, [client, query.error]);
  return query;
}
