import { useInfiniteQuery } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';
import type { MeasurementKind, MeasurementsRepository } from './ports';

type Session = components['schemas']['MeContextResponse'];

// Khóa bắt đầu bằng 'measurements' để duyệt xong (useApproveDocument) làm mới danh sách.
// F09a: mỗi trang 50 số đo, "Xem thêm" tải trang kế theo cursor.
export function useProfileMeasurements(
  repository: MeasurementsRepository,
  session: Session | null | undefined,
  profileId: string,
  kind: MeasurementKind,
) {
  return useInfiniteQuery({
    queryKey: ['measurements', session?.account.id ?? null, session?.family?.id ?? null, profileId, kind],
    enabled: session?.role === 'main' && Boolean(session.family),
    retry: false,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => repository.list(profileId, kind, pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
  });
}
