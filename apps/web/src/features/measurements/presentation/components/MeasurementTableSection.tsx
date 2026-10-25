import { MoreButton } from '@src/features/documents/presentation/components/MoreButton';
import type { MeasurementKind } from '../../application/ports';
import type { useProfileMeasurements } from '../../application/useProfileMeasurements';
import { MeasurementTable } from './MeasurementTable';

type MeasurementTableSectionProps = {
  kind: MeasurementKind;
  measurements: ReturnType<typeof useProfileMeasurements>;
};

// Khung "Bảng số đo chi tiết"; F09a: còn trang sau thì hiện "Xem thêm" dưới bảng.
export function MeasurementTableSection({ kind, measurements }: MeasurementTableSectionProps) {
  const rows = measurements.data?.pages.flatMap((page) => page.items) ?? [];
  const settled = !measurements.isPending && !measurements.isError;
  return (
    <section
      aria-labelledby="measurement-table-title"
      className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm lg:p-6"
    >
      <h2 id="measurement-table-title" className="text-lg font-semibold text-[#004135]">
        Bảng số đo chi tiết
      </h2>
      <MeasurementTable
        kind={kind}
        measurements={rows}
        loading={measurements.isPending}
        error={measurements.isError}
        retry={() => void measurements.refetch()}
      />
      {settled && measurements.hasNextPage && (
        <MoreButton
          loading={measurements.isFetchingNextPage}
          load={() => void measurements.fetchNextPage()}
        />
      )}
    </section>
  );
}
