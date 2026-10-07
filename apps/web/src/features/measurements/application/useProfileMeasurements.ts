import { useQuery } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';
import type { MeasurementKind, MeasurementsRepository } from './ports';

type Session = components['schemas']['MeContextResponse'];

// Khóa bắt đầu bằng 'measurements' để duyệt xong (useApproveDocument) làm mới danh sách.
export function useProfileMeasurements(
  repository: MeasurementsRepository,
  session: Session | null | undefined,
  profileId: string,
  kind: MeasurementKind,
) {
  return useQuery({
    queryKey: ['measurements', session?.account.id ?? null, session?.family?.id ?? null, profileId, kind],
    enabled: session?.role === 'main' && Boolean(session.family),
    retry: false,
    queryFn: ({ signal }) => repository.list(profileId, kind, signal),
  });
}
