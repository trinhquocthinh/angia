import { Link } from '@tanstack/react-router';
import type { Measurement, MeasurementKind } from '../../application/ports';
import { MeasurementRow } from './MeasurementRow';

type MeasurementTableProps = {
  kind: MeasurementKind;
  measurements: Measurement[];
  loading: boolean;
  error: boolean;
  retry: () => void;
};

const HEADERS: Record<MeasurementKind, string[]> = {
  blood_pressure: ['Ngày đo', 'Tâm thu', 'Tâm trương', 'Mạch', 'Nguồn'],
  glucose: ['Ngày đo', 'Đường huyết', 'Đơn vị', 'Nguồn'],
};

const ERROR_LAYOUT = 'flex flex-col items-start gap-3 rounded-2xl bg-danger-soft p-4 text-body';

// Bảng số đo chi tiết (Stitch 718c9615): chỉ con số trung tính, không tô màu "cao/thấp" (BR-033).
export function MeasurementTable({ kind, measurements, loading, error, retry }: MeasurementTableProps) {
  if (loading)
    return (
      <div
        role="status"
        aria-label="Đang tải số đo"
        className="h-64 animate-pulse rounded-2xl bg-accent-soft motion-reduce:animate-none"
      />
    );
  if (error)
    return (
      <div role="alert" className={ERROR_LAYOUT}>
        <p>Không tải được số đo.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-btn rounded-2xl bg-surface px-4 text-button-secondary font-semibold text-accent"
        >
          Thử lại
        </button>
      </div>
    );
  if (measurements.length === 0)
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border/60 bg-bg px-6 py-10 text-center">
        <p className="text-caption text-text-secondary">Chưa có số đo. Chụp màn hình máy đo để bắt đầu.</p>
        <Link
          to="/upload"
          className="inline-flex min-h-btn items-center rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover"
        >
          Tải ảnh máy đo
        </Link>
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-2xl border border-border/35 bg-bg">
      <table className="w-full min-w-[480px] text-body">
        <caption className="sr-only">Bảng số đo đã duyệt, mới nhất trước</caption>
        <thead className="border-b border-border/35 bg-surface-container text-caption uppercase tracking-wider text-text-secondary">
          <tr>
            {HEADERS[kind].map((header, index) => (
              <th
                key={header}
                scope="col"
                className={index === 0 ? 'px-4 py-3 text-left' : 'px-4 py-3 text-right'}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface">
          {measurements.map((measurement) => (
            <MeasurementRow key={measurement.id} kind={kind} measurement={measurement} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
