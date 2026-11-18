import type { IssuedInvitation } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';

export function InvitationRevokeSummary({ invitation }: { invitation: IssuedInvitation }) {
  return (
    <div className="household-invite-revoke-summary">
      <InvitationIcon name="key" />
      <div>
        <strong>{invitation.code.match(/.{1,4}/g)?.join(' ')}</strong>
        <span>Vai trò {invitation.role === 'main' ? 'Đồng quản lý' : 'Thành viên'}</span>
      </div>
      <span className="household-invite-status">Đang mở</span>
    </div>
  );
}
