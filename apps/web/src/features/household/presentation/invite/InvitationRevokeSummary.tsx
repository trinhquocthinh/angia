import { ClayIcon } from '@src/shared/ui/ClayIcon';
import type { IssuedInvitation } from '../../application/invitationPorts';

export function InvitationRevokeSummary({ invitation }: { invitation: IssuedInvitation }) {
  return (
    <div className="household-invite-revoke-summary">
      <ClayIcon name="key" size={40} />
      <div>
        <strong>{invitation.code.match(/.{1,4}/g)?.join(' ')}</strong>
        <span>Vai trò {invitation.role === 'main' ? 'Đồng quản lý' : 'Thành viên'}</span>
      </div>
      <span className="household-invite-status">Đang mở</span>
    </div>
  );
}
