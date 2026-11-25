import type { SelfReminder } from '@angia/contracts';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { describeDoseFailure } from '../application/describeDoseFailure';
import { doseConfirmationLabel } from '../application/doseConfirmationLabel';
import { useDoseConfirmation } from '../application/useDoseConfirmation';
import { createDoseConfirmationRepository } from '../infrastructure/createDoseConfirmationRepository';

const repository = createDoseConfirmationRepository();
const primary =
  'inline-flex min-h-btn w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-xs transition-colors hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
const secondary =
  'inline-flex min-h-btn cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-accent-soft disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

type Props = {
  reminder: Pick<SelfReminder, 'id' | 'confirmation' | 'canConfirm' | 'canUndo'>;
  session: ProfileSession;
};

// Xác nhận cả buổi theo Stitch 8bafc41f / 1c851b03 (SPEC-046, BR-033): nút full-width, thẻ đã dùng nền accent-soft.
export function DoseConfirmationControl({ reminder, session }: Props) {
  const dose = useDoseConfirmation(repository, session, reminder.id);
  const { confirmation, canConfirm, canUndo } = reminder;
  const failure = dose.failure && describeDoseFailure(dose.failure.error);
  const locked = dose.pending !== null;
  if (!confirmation && !canConfirm && !failure) return null;
  return (
    <div className="mt-auto flex flex-col gap-2.5 pt-1">
      {confirmation && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-accent-soft px-3.5 py-2.5">
          <p className="inline-flex items-center gap-1.5 text-caption font-semibold break-words text-accent tabular-nums">
            <AdminIcon name="check_circle" size={18} />
            {doseConfirmationLabel(confirmation)}
          </p>
          {canUndo && (
            <button type="button" disabled={locked} onClick={() => void dose.undo()} className={secondary}>
              {dose.pending === 'undo' ? 'Đang hủy…' : 'Hủy xác nhận'}
            </button>
          )}
        </div>
      )}
      {!confirmation && canConfirm && (
        <button type="button" disabled={locked} onClick={() => void dose.confirm()} className={primary}>
          <AdminIcon name="check" size={18} />
          {dose.pending === 'confirm' ? 'Đang xác nhận…' : 'Đã dùng'}
        </button>
      )}
      {failure && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-caption text-danger">
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
