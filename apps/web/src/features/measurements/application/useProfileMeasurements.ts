import { useInfiniteQuery } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { MeasurementKind, MeasurementsRepository } from './ports';

type Session = components['schemas']['MeContextResponse'];

// Khóa bắt đầu bằng 'measurements' để duyệt xong (useApproveDocument) làm mới danh sách.
// Chỉ hồ sơ đã đồng thuận mới tải (API trả 409 với hồ sơ khác).
// F09a: mỗi trang 50 số đo, "Xem thêm" tải trang kế theo cursor.
export function useProfileMeasurements(
  repository: MeasurementsRepository,
  session: Session | null | undefined,
  profileId: string,
  kind: MeasurementKind,
  profile: HealthProfile | undefined,
) {
  return useInfiniteQuery({
    queryKey: ['measurements', session?.account.id ?? null, session?.family?.id ?? null, profileId, kind],
    enabled: session?.role === 'main' && Boolean(session.family) && profile?.consentStatus === 'confirmed',
    retry: false,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => repository.list(profileId, kind, pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
  });
}
