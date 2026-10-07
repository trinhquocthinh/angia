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

// Bảng số đo chi tiết (Stitch 718c9615): chỉ con số trung tính, không tô màu "cao/thấp" (BR-033).
export function MeasurementTable({ kind, measurements, loading, error, retry }: MeasurementTableProps) {
  if (loading)
    return (
      <div
        role="status"
        aria-label="Đang tải số đo"
        className="h-64 animate-pulse rounded-2xl bg-[#eaf6f5] motion-reduce:animate-none"
      />
    );
  if (error)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-[#fdecea] p-4 text-sm">
        <p>Không tải được số đo.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135]"
        >
          Thử lại
        </button>
      </div>
    );
  if (measurements.length === 0)
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#eaf6f5] px-6 py-12 text-center">
        <p className="text-sm text-[#3f4946]">Chưa có số đo. Chụp màn hình máy đo để bắt đầu.</p>
        <Link
          to="/upload"
          className="inline-flex min-h-11 items-center rounded-xl bg-[#004135] px-5 text-sm font-semibold text-white"
        >
          Tải ảnh máy đo
        </Link>
      </div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <caption className="sr-only">Bảng số đo đã duyệt, mới nhất trước</caption>
        <thead className="bg-[#eaf6f5] text-xs uppercase tracking-wider text-[#3f4946]">
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
        <tbody>
          {measurements.map((measurement) => (
            <MeasurementRow key={measurement.id} kind={kind} measurement={measurement} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
