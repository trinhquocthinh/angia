import type { SelfReminder } from '@angia/contracts';
import { describeDoseFailure } from '@src/features/doseConfirmations/application/describeDoseFailure';
import { doseConfirmationLabel } from '@src/features/doseConfirmations/application/doseConfirmationLabel';
import { useDoseConfirmation } from '@src/features/doseConfirmations/application/useDoseConfirmation';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { Button } from '@src/shared/ui/button/Button';
import { createTodayRepository } from '../infrastructure/createTodayRepository';

const repository = createTodayRepository();

export function TodayDoseControl({ reminder, session }: { reminder: SelfReminder; session: ProfileSession }) {
  const dose = useDoseConfirmation(repository, session, reminder.id);
  const failure = dose.failure && describeDoseFailure(dose.failure.error);
  const locked = dose.pending !== null;
  return (
    <div className="flex flex-col gap-3" aria-busy={locked}>
      {reminder.confirmation && (
        <p role="status" className="font-semibold tabular-nums">
          {doseConfirmationLabel(reminder.confirmation)}
        </p>
      )}
      {!reminder.confirmation && reminder.canConfirm && (
        <Button className="w-full" disabled={locked} onClick={() => void dose.confirm()}>
          {dose.pending === 'confirm' ? 'Đang xác nhận…' : 'Đã dùng'}
        </Button>
      )}
      {reminder.confirmation && reminder.canUndo && (
        <Button variant="secondary" className="w-full" disabled={locked} onClick={() => void dose.undo()}>
          {dose.pending === 'undo' ? 'Đang hủy…' : 'Hủy xác nhận'}
        </Button>
      )}
      {failure && (
        <div role="alert" className="flex flex-col gap-3 text-danger">
          <p>{failure.message}</p>
          {failure.canRetry && dose.failure && (
            <Button variant="secondary" disabled={locked} onClick={() => void dose[dose.failure!.action]()}>
              Thử lại
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
