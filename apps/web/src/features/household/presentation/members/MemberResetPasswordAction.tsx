import { Button } from '@src/shared/ui/button/Button';
import { MemberResetIcon } from './MemberResetIcon';

export function MemberResetPasswordAction({ disabled, onOpen }: { disabled: boolean; onOpen: () => void }) {
  return (
    <Button
      variant="secondary"
      className="member-reset-trigger"
      disabled={disabled}
      onClick={(event) => {
        event.currentTarget.focus();
        onOpen();
      }}
    >
      <MemberResetIcon name="member-reset-key" size={20} />
      <span>Đặt lại mật khẩu</span>
    </Button>
  );
}
