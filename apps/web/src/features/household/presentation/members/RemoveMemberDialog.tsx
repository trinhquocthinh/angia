import { MemberClayGlyph } from './MemberClayGlyph';
import { useId } from 'react';
import { Button } from '@src/shared/ui/button/Button';
import { ModalSurface } from '@src/shared/ui/ModalSurface';

type Props = {
  displayName: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function RemoveMemberDialog({ displayName, pending, error, onClose, onConfirm }: Props) {
  const titleId = useId();
  return (
    <ModalSurface
      className="household-member-remove-dialog"
      labelledBy={titleId}
      pending={pending}
      onClose={onClose}
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
          <MemberClayGlyph name="home-close" size={20} />
        </Button>
        <div className="household-member-remove-icon" aria-hidden="true">
          <MemberClayGlyph name="home-logout-danger" size={28} />
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
    </ModalSurface>
  );
}
