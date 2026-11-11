import type { AsNeededDose } from '@angia/contracts';
import { formatDoseTime } from '../application/formatDoseTime';

type Props = { dose: AsNeededDose; pending: boolean; onConfirm: () => void; onCancel: () => void };
export function AsNeededDoseDeleteConfirmation({ dose, pending, onConfirm, onCancel }: Props) {
  return (
    <div
      role="group"
      aria-label="Xác nhận xóa bản ghi"
      className="flex flex-col gap-3 rounded-xl bg-danger-soft p-4 text-sm"
    >
      <p>Xóa bản ghi liều lúc {formatDoseTime(dose.givenAt)}? Thao tác này không thể hoàn tác.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="min-h-11 rounded-xl bg-danger px-4 font-semibold text-on-accent disabled:opacity-50"
        >
          {pending ? 'Đang xóa…' : 'Xác nhận xóa'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="min-h-11 rounded-xl bg-surface px-4 disabled:opacity-50"
        >
          Giữ bản ghi
        </button>
      </div>
    </div>
  );
}
