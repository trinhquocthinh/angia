import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';
import { isReading, reviewPollInterval } from './reviewQueuePolling';
import type { ApproveDocumentRequest, ReviewRepository } from './reviewPorts';

type Session = components['schemas']['MeContextResponse'];

const reviewScopeKey = (session: Session | null | undefined) =>
  ['review', session?.account.id ?? null, session?.family?.id ?? null] as const;

// Hàng đợi gồm cả chứng từ AI đang đọc (hiện ngay sau khi tải) và chỉ hỏi lại khi còn chứng từ đang đọc.
// Chỉ main gọi API duyệt (requireMain); khóa query theo tài khoản + gia đình để không lẫn dữ liệu khi đổi phiên.
// F09a: mỗi trang 50 chứng từ, "Xem thêm" tải trang kế theo cursor.
export function useReviewQueue(repository: ReviewRepository, session: Session | null | undefined) {
  return useInfiniteQuery({
    queryKey: [...reviewScopeKey(session), 'queue'],
    enabled: session?.role === 'main' && Boolean(session.family),
    retry: false,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => repository.queue(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
    refetchInterval: (query) => reviewPollInterval(query.state.data?.pages.flatMap((page) => page.items)),
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
    // Mở ngay sau khi tải: AI còn đọc thì hỏi lại tới khi có bản trích xuất (form tự hiện).
    refetchInterval: (query) => (query.state.data && isReading(query.state.data.document) ? 3000 : false),
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

// Loại bỏ chứng từ chờ duyệt/chờ nhập tay; ảnh gốc giữ nguyên, chứng từ rời hàng đợi.
export function useRejectDocument(
  repository: ReviewRepository,
  session: Session | null | undefined,
  id: string,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => repository.reject(id, session?.csrfToken ?? ''),
    onSuccess: () => client.invalidateQueries({ queryKey: reviewScopeKey(session) }),
  });
}
