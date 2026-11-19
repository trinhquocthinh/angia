import type { IssuedInvitation } from '../../application/invitationPorts';
import { InvitationIcon } from './InvitationIcon';

export type InvitationDisplayStatus = 'active' | 'expired' | 'revoked' | 'unavailable' | 'accepted';
export function InvitationCodeCard({
  invitation,
  status,
}: {
  invitation: IssuedInvitation;
  status: InvitationDisplayStatus;
}) {
  const inactive = status === 'revoked' || status === 'unavailable' || status === 'accepted';
  const date = new Date(invitation.expiresAt);
  return (
    <div className="household-invite-code-card" data-status={status}>
      <div className="household-invite-code-top">
        <span className="household-invite-code-role">
          {status === 'accepted'
            ? 'Lời mời đã được dùng'
            : status === 'expired'
              ? 'Mã đã hết hạn'
              : status === 'revoked'
                ? 'Đã thu hồi lời mời'
                : status === 'unavailable'
                  ? 'Lời mời không còn dùng được'
                  : invitation.role === 'main'
                    ? 'Đồng quản lý'
                    : 'Thành viên'}
        </span>
        {!inactive && invitation.code && status === 'active' && (
          <span className="household-invite-code-label">Mã mời</span>
        )}
      </div>
      {!inactive && invitation.code && (
        <>
          <output className="household-invite-code" aria-label="Mã mời">
            {invitation.code.match(/.{1,4}/g)?.join(' ')}
          </output>
          <p className="household-invite-expiry">
            <InvitationIcon name="clock" />
            Hết hạn{' '}
            {Number.isNaN(date.getTime())
              ? 'chưa rõ thời điểm'
              : new Intl.DateTimeFormat('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                }).format(date)}
          </p>
        </>
      )}
      {status !== 'active' && (
        <p className="household-invite-ended" role="status">
          {status === 'revoked'
            ? 'Mã và link này không còn dùng được.'
            : 'Lời mời không còn dùng được. Hãy tạo lời mời mới để gửi cho người thân.'}
        </p>
      )}
    </div>
  );
}
