import type { RevisitList as RevisitGroups } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import type { RevisitPrescription } from '../application/ports';

type Props = {
  data: RevisitGroups;
  /** Không truyền: chỉ đọc (tự xem, SPEC-042). */
  onEdit?: (prescription: RevisitPrescription, revisitDate: string) => void;
};
export function RevisitList({ data, onEdit }: Props) {
  if (!data.length)
    return <p className="rounded-[20px] bg-surface p-6 text-sm">Chưa có lịch tái khám từ hôm nay.</p>;
  return (
    <div className="flex flex-col gap-4">
      {data.map((group) => (
        <section key={group.revisitDate} className="rounded-[20px] bg-surface p-5 lg:p-6">
          <h2 className="text-lg font-semibold text-accent">{formatDay(group.revisitDate)}</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {group.prescriptions.map((prescription) => (
              <li
                key={prescription.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent-soft p-4"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">Đơn ngày {formatDay(prescription.issuedDate)}</p>
                  <p className="break-words text-text-secondary">
                    {prescription.facility || 'Đơn không ghi nơi khám'}
                  </p>
                </div>
                {onEdit && (
                  <button
                    id={`revisit-edit-${prescription.id}`}
                    type="button"
                    onClick={() => onEdit(prescription, group.revisitDate)}
                    className="min-h-11 rounded-full border border-accent px-4 text-sm font-semibold text-accent"
                  >
                    Sửa ngày hẹn
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
