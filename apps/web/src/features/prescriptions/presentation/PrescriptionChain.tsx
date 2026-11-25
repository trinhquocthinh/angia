import { Link } from '@tanstack/react-router';
import type { PrescriptionListItem } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';

export function PrescriptionChain({ data, profileId }: { data: PrescriptionListItem[]; profileId: string }) {
  if (!data.length)
    return <p className="rounded-[20px] bg-surface p-6 text-body">Chưa có đơn thuốc đã lưu.</p>;
  return (
    <ol aria-label="Chuỗi đơn thuốc theo thời gian" className="flex flex-col gap-3">
      {data.map((entry) => (
        <li key={entry.id} className="min-w-0 rounded-[20px] bg-surface p-5 break-words">
          <Link
            to="/profiles/$profileId/prescriptions/$prescriptionId"
            params={{ profileId, prescriptionId: entry.id }}
            className="inline-flex min-h-12 items-center text-button-secondary font-semibold text-accent underline underline-offset-4"
          >
            Đơn ngày {formatDay(entry.issuedDate)}
          </Link>
          <p className="mt-1 text-body">{entry.facility ?? 'Không ghi nơi khám'}</p>
          <p className="mt-1 text-caption text-text-secondary">
            {entry.itemCount} dòng thuốc · {entry.origin === 'document' ? 'Từ giấy tờ' : 'Nhập tay'}
          </p>
          {entry.revisitDate && <p className="mt-2 text-body">Ngày hẹn: {formatDay(entry.revisitDate)}</p>}
        </li>
      ))}
    </ol>
  );
}
