import type { AsNeededDose } from '@angia/contracts';
import { formatDoseTime } from '../application/formatDoseTime';

type Props = { doses: AsNeededDose[]; pending: boolean; onRemove?: (dose: AsNeededDose) => void };
export function AsNeededDoseList({ doses, pending, onRemove }: Props) {
  if (doses.length === 0)
    return <p className="text-sm text-text-secondary">Chưa ghi liều trong khoảng ngày đã chọn.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {doses.map((dose) => (
        <li key={dose.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-bg p-3">
          <div className="min-w-0 text-sm">
            <p className="font-semibold">{formatDoseTime(dose.givenAt)}</p>
            {(dose.quantity !== null || dose.unit) && (
              <p className="break-words">
                {[
                  dose.quantity === null
                    ? null
                    : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(dose.quantity),
                  dose.unit,
                ]
                  .filter((part) => part !== null && part !== '')
                  .join(' ')}
              </p>
            )}
          </div>
          {onRemove && (
            <button
              type="button"
              disabled={pending}
              onClick={() => onRemove(dose)}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-danger disabled:opacity-50"
            >
              Xóa bản ghi
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
