import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from './AdminRequestError';
import type { FamilyCapRepository } from './ports';

const CAPS_KEY = ['admin', 'family-extraction-caps'];

// SPEC-031: đọc/ghi trần OCR từng gia đình; lỗi phiên/quyền thì làm mới phiên như các thao tác quản trị khác.
export function useFamilyCaps(repository: FamilyCapRepository, csrfToken: string | null) {
  const client = useQueryClient();
  const caps = useQuery({
    queryKey: CAPS_KEY,
    enabled: Boolean(csrfToken),
    retry: false,
    queryFn: ({ signal }) => repository.list(signal),
  });
  const save = useMutation({
    retry: false,
    mutationFn: ({ familyId, capUsd }: { familyId: string; capUsd: number | null }) => {
      if (!csrfToken) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      return repository.setCap(familyId, capUsd, csrfToken);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: CAPS_KEY }),
    onError: async (error) => {
      if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
        await client.invalidateQueries({ queryKey: ['current-session'] });
      }
    },
  });
  return { caps, save };
}
