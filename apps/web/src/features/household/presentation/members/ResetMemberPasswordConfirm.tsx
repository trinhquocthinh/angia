import { Button } from '@src/shared/ui/button/Button';
import { MemberResetIcon } from './MemberResetIcon';

type Props = {
  titleId: string;
  displayName: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function ResetMemberPasswordConfirm({
  titleId,
  displayName,
  pending,
  error,
  onClose,
  onConfirm,
}: Props) {
  return (
    <>
      <div className="member-reset-header">
        <div className="member-reset-badge" aria-hidden="true">
          <MemberResetIcon name="member-reset-lock" size={24} />
        </div>
        <h2 id={titleId}>Đặt lại mật khẩu cho {displayName}?</h2>
      </div>
      {error && (
        <div role="alert" className="member-reset-alert">
          <MemberResetIcon name="member-reset-alert-circle" size={18} />
          <span>{error}</span>
        </div>
      )}
      <ul className="member-reset-points">
        <li>{displayName} sẽ bị đăng xuất khỏi mọi thiết bị.</li>
        <li>Mật khẩu tạm có hiệu lực 24 giờ.</li>
        <li>{displayName} phải đổi mật khẩu khi đăng nhập.</li>
      </ul>
      <div className="member-reset-actions">
        <Button data-autofocus variant="secondary" disabled={pending} onClick={onClose}>
          Huỷ
        </Button>
        <Button className="member-reset-confirm-btn" disabled={pending} onClick={onConfirm}>
          {pending ? 'Đang đặt lại…' : 'Đặt lại mật khẩu'}
        </Button>
      </div>
    </>
  );
}
