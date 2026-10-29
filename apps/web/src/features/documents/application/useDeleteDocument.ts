import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { invalidateDeletedDocument } from './invalidateDeletedDocument';
import type { ReviewRepository } from './reviewPorts';
import { ReviewRequestError } from './ReviewRequestError';

export function useDeleteDocument(
  repository: Pick<ReviewRepository, 'deletionImpact' | 'deleteDocument'>,
  session: ProfileSession,
  documentId: string,
  profileId: string,
  enabled = true,
) {
  const client = useQueryClient();
  const sending = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowed = session.role === 'main' && Boolean(session.family) && Boolean(session.csrfToken);
  const query = useQuery({
    queryKey: ['document-deletion-impact', session.account.id, session.family?.id, documentId],
    enabled: enabled && allowed,
    retry: false,
    queryFn: ({ signal }) => repository.deletionImpact(documentId, signal),
  });
  const impact = query.isFetching || query.isError ? null : (query.data ?? null);
  const remove = async () => {
    if (sending.current || !enabled || !allowed || !impact) return false;
    sending.current = true;
    setPending(true);
    setError(null);
    try {
      await repository.deleteDocument(documentId, session.csrfToken);
    } catch (cause) {
      setError(
        cause instanceof ReviewRequestError ? cause.message : 'Không thể xóa chứng từ. Vui lòng thử lại.',
      );
      if (cause instanceof ReviewRequestError && (cause.status === 401 || cause.status === 403)) {
        void client.invalidateQueries({ queryKey: ['current-session'] });
        void client.invalidateQueries({ queryKey: ['profiles'] });
      }
      sending.current = false;
      setPending(false);
      return false;
    }
    await invalidateDeletedDocument(client, session, documentId, profileId);
    setPending(false);
    return true;
  };
  return {
    impact,
    loading: query.isPending || query.isFetching,
    pending,
    error: error ?? (query.isError ? 'Không thể tải tác động xóa. Vui lòng thử lại.' : null),
    remove,
    retry: () => void query.refetch(),
    reset: () => setError(null),
  };
}
