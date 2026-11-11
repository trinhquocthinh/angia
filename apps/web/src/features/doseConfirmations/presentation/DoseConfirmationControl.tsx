import type { SelfReminder } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { describeDoseFailure } from '../application/describeDoseFailure';
import { doseConfirmationLabel } from '../application/doseConfirmationLabel';
import { useDoseConfirmation } from '../application/useDoseConfirmation';
import { createDoseConfirmationRepository } from '../infrastructure/createDoseConfirmationRepository';

const repository = createDoseConfirmationRepository();
const primary =
  'min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent disabled:opacity-60';
const secondary =
  'min-h-11 rounded-full border border-accent px-5 text-sm font-semibold text-accent disabled:opacity-60';

type Props = {
  reminder: Pick<SelfReminder, 'id' | 'confirmation' | 'canConfirm' | 'canUndo'>;
  session: ProfileSession;
};

// Xác nhận cả buổi (SPEC-046, Design §9.6): quyền lấy từ API. Chưa ai bấm thì không có nhãn nào (BR-033).
export function DoseConfirmationControl({ reminder, session }: Props) {
  const dose = useDoseConfirmation(repository, session, reminder.id);
  const { confirmation, canConfirm, canUndo } = reminder;
  const failure = dose.failure && describeDoseFailure(dose.failure.error);
  const locked = dose.pending !== null;
  if (!confirmation && !canConfirm && !failure) return null;
  return (
    <div className="flex flex-col items-start gap-2">
      {confirmation && (
        <p className="text-sm font-semibold break-words text-accent tabular-nums">
          {doseConfirmationLabel(confirmation)}
        </p>
      )}
      {!confirmation && canConfirm && (
        <button type="button" disabled={locked} onClick={() => void dose.confirm()} className={primary}>
          {dose.pending === 'confirm' ? 'Đang xác nhận…' : 'Đã dùng'}
        </button>
      )}
      {confirmation && canUndo && (
        <button type="button" disabled={locked} onClick={() => void dose.undo()} className={secondary}>
          {dose.pending === 'undo' ? 'Đang hủy…' : 'Hủy xác nhận'}
        </button>
      )}
      {failure && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-danger">
          <p>{failure.message}</p>
          {failure.canRetry && dose.failure && (
            <button
              type="button"
              disabled={locked}
              onClick={() => void dose[dose.failure!.action]()}
              className={secondary}
            >
              Thử lại
            </button>
          )}
        </div>
      )}
    </div>
  );
}
