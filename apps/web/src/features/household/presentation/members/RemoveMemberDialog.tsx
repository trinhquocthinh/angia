import { useId } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { Button } from '@src/shared/ui/button/Button';
import { useModalDialog } from '@src/shared/ui/useModalDialog';
import '@src/shared/ui/modal-motion.css';

type Props = {
  displayName: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function RemoveMemberDialog({ displayName, pending, error, onClose, onConfirm }: Props) {
  const ref = useModalDialog();
  const titleId = useId();
  return (
    <dialog
      ref={ref}
      className="angia-modal household-member-remove-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div className="household-member-remove-content" aria-busy={pending}>
        <span className="household-member-remove-handle" aria-hidden="true" />
        <Button
          variant="icon"
          className="household-member-remove-close"
          aria-label="Đóng xác nhận gỡ thành viên"
          disabled={pending}
          onClick={onClose}
        >
          <AdminIcon name="close" size={20} />
        </Button>
        <div className="household-member-remove-icon" aria-hidden="true">
          <AdminIcon name="person_remove" size={28} />
        </div>
        <h2 id={titleId}>Gỡ {displayName} khỏi nhà?</h2>
        <ul className="household-member-remove-points">
          <li>{displayName} không còn xem được dữ liệu của nhà.</li>
          <li>
            Hồ sơ liên kết của {displayName} ở lại nhà nhưng đã rút đồng thuận — không ai trong nhà đọc hay
            ghi tiếp.
          </li>
          <li>{displayName} tải được hồ sơ của mình trong 7 ngày.</li>
        </ul>
        {error && (
          <p role="alert" className="household-member-alert">
            {error}
          </p>
        )}
        <div className="household-member-remove-actions">
          <Button data-autofocus variant="secondary" disabled={pending} onClick={onClose}>
            Huỷ
          </Button>
          <Button className="household-member-remove-confirm" disabled={pending} onClick={onConfirm}>
            {pending ? 'Đang gỡ…' : 'Gỡ khỏi nhà'}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
