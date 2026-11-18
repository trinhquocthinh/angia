import type { Ref } from 'react';
import { Button } from '@src/shared/ui/button/Button';
import { InvitationIcon } from './InvitationIcon';

type Props = { newButtonRef: Ref<HTMLButtonElement>; pending: boolean; onNew: () => void };
export function InvitationInactiveActions({ newButtonRef, pending, onNew }: Props) {
  return (
    <div className="household-invite-inactive-actions">
      <Button ref={newButtonRef} className="household-invite-primary" disabled={pending} onClick={onNew}>
        <InvitationIcon name="plus" />
        Tạo lời mời mới
      </Button>
      <div className="household-invite-copy-actions">
        <Button variant="secondary" disabled className="household-invite-expired-share">
          <InvitationIcon name="send" />
          Gửi qua Zalo
        </Button>
        <Button variant="secondary" disabled>
          <InvitationIcon name="copy" />
          Sao chép mã
        </Button>
        <Button variant="secondary" disabled>
          <InvitationIcon name="link" />
          Sao chép link
        </Button>
      </div>
    </div>
  );
}
