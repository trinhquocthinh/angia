import { useId } from 'react';
import { useModalDialog } from '@src/shared/ui/useModalDialog';
import { Button } from '@src/shared/ui/button/Button';
import type { IssuedInvitation } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';
import { InvitationRevokeSummary } from './InvitationRevokeSummary';
import '@src/shared/ui/modal-motion.css';

type Props = {
  invitation: IssuedInvitation;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};
export function RevokeInvitationDialog({ invitation, pending, error, onClose, onConfirm }: Props) {
  const ref = useModalDialog();
  const titleId = useId();
  return (
    <dialog
      ref={ref}
      className="angia-modal household-invite-revoke"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div className="household-invite-revoke-content" aria-busy={pending}>
        <span className="household-invite-handle" aria-hidden="true" />
        <Button
          variant="icon"
          className="household-invite-close"
          aria-label="Đóng xác nhận thu hồi"
          disabled={pending}
          onClick={onClose}
        >
          <InvitationIcon name="close" />
        </Button>
        <div className="household-invite-revoke-icon">
          <InvitationIcon name="trash" />
        </div>
        <h2 id={titleId}>Thu hồi lời mời này?</h2>
        <p>Người nhận sẽ không dùng được mã hoặc link này nữa.</p>
        <InvitationRevokeSummary invitation={invitation} />
        {error && (
          <p role="alert" className="text-danger">
            {error}
          </p>
        )}
        <div className="household-invite-revoke-actions">
          <Button autoFocus variant="secondary" disabled={pending} onClick={onClose}>
            Giữ lời mời
          </Button>
          <Button className="household-invite-danger" disabled={pending} onClick={onConfirm}>
            <InvitationIcon name="trash" />
            {pending ? 'Đang thu hồi…' : 'Thu hồi lời mời'}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
