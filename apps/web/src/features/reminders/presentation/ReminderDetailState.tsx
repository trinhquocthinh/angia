import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { Button } from '@src/shared/ui/button/Button';

type Props = { kind: 'loading' } | { kind: 'hidden' } | { kind: 'error'; onRetry: () => void };

export function ReminderDetailState(props: Props) {
  if (props.kind === 'loading') {
    return (
      <div className="reminder-card flex flex-col gap-4 p-6">
        <p role="status" className="text-body font-medium text-text-secondary">
          Đang tải lời nhắc…
        </p>
        <span className="reminder-skeleton-bar w-2/3" aria-hidden="true" />
        <span className="reminder-skeleton-bar w-full" aria-hidden="true" />
        <span className="reminder-skeleton-bar w-1/2" aria-hidden="true" />
      </div>
    );
  }
  if (props.kind === 'hidden') {
    return (
      <div className="reminder-card flex items-start gap-3.5 p-6">
        <span className="reminder-section-tile text-accent" aria-hidden="true">
          <AdminIcon name="shield" size={22} />
        </span>
        <p role="alert" className="min-w-0 self-center text-body font-medium text-text-primary">
          Không tìm thấy lời nhắc hoặc bạn không có quyền xem.
        </p>
      </div>
    );
  }
  return (
    <div role="alert" className="reminder-card flex flex-col items-start gap-4 p-6 text-body">
      <div className="flex items-start gap-3.5">
        <span className="reminder-section-tile text-danger" aria-hidden="true">
          <AdminIcon name="info" size={22} />
        </span>
        <p className="self-center font-medium text-text-primary">Không thể tải lời nhắc. Vui lòng thử lại.</p>
      </div>
      <Button variant="secondary" onClick={props.onRetry}>
        Thử lại
      </Button>
    </div>
  );
}
