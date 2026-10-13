import { useQuery } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';
import type { MeasurementKind, MeasurementsRepository } from './ports';
import { seriesRange, type WeekSpan } from './seriesRange';

type Session = components['schemas']['MeContextResponse'];

// Khóa bắt đầu bằng 'measurements' để duyệt/nhập số đo xong làm mới cả biểu đồ.
export function useMeasurementSeries(
  repository: MeasurementsRepository,
  session: Session | null | undefined,
  profileId: string,
  kind: MeasurementKind,
  weeks: WeekSpan,
) {
  const range = seriesRange(weeks);
  return {
    range,
    query: useQuery({
      queryKey: [
        'measurements',
        session?.account.id ?? null,
        session?.family?.id ?? null,
        profileId,
        kind,
        'series',
        range.from,
        range.to,
      ],
      enabled: session?.role === 'main' && Boolean(session.family),
      retry: false,
      queryFn: ({ signal }) => repository.series(profileId, kind, range, signal),
    }),
  };
}
