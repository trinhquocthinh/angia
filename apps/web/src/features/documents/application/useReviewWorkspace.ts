import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';
import type { ApproveDocumentRequest, ReviewRepository } from './reviewPorts';

type Session = components['schemas']['MeContextResponse'];

const reviewScopeKey = (session: Session | null | undefined) =>
  ['review', session?.account.id ?? null, session?.family?.id ?? null] as const;

// Chỉ main gọi API duyệt (requireMain); khóa query theo tài khoản + gia đình để không lẫn dữ liệu khi đổi phiên.
export function useReviewQueue(repository: ReviewRepository, session: Session | null | undefined) {
  return useQuery({
    queryKey: [...reviewScopeKey(session), 'queue'],
    enabled: session?.role === 'main' && Boolean(session.family),
    retry: false,
    queryFn: ({ signal }) => repository.queue(signal),
  });
}

export function useDocumentReview(
  repository: ReviewRepository,
  session: Session | null | undefined,
  id: string,
) {
  return useQuery({
    queryKey: [...reviewScopeKey(session), 'document', id],
    enabled: session?.role === 'main' && Boolean(session.family),
    retry: false,
    queryFn: ({ signal }) => repository.review(id, signal),
  });
}

export function useApproveDocument(
  repository: ReviewRepository,
  session: Session | null | undefined,
  id: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: ApproveDocumentRequest) => repository.approve(id, body, session?.csrfToken ?? ''),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: reviewScopeKey(session) }),
        client.invalidateQueries({ queryKey: ['measurements'] }),
      ]);
    },
  });
}
