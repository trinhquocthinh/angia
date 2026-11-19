import { Link } from '@tanstack/react-router';
import type { InvitationDisplayStatus } from './InvitationCodeCard';
import { InvitationIcon } from './InvitationIcon';

export function InvitationHeading({ status }: { status: InvitationDisplayStatus }) {
  return (
    <div className="household-invite-heading">
      <Link to="/family/members" className="household-invite-back" aria-label="Quay lại">
        <InvitationIcon name="back" />
      </Link>
      <h1 id="household-invite-title">Mời người thân</h1>
      <span className="household-invite-status" data-ended={status !== 'active'}>
        <InvitationIcon name={status === 'accepted' ? 'check' : status === 'expired' ? 'expired' : 'clock'} />
        {status === 'accepted'
          ? 'Đã dùng'
          : status === 'expired'
            ? 'Đã hết hạn'
            : status === 'revoked'
              ? 'Đã thu hồi'
              : status === 'unavailable'
                ? 'Không còn dùng được'
                : '1 lần · 7 ngày'}
      </span>
    </div>
  );
}
