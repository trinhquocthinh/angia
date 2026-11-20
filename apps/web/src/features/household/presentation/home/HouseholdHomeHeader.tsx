import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { summarizeMemberCounts } from '../../application/summarizeMemberCounts';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { MemberClayGlyph } from '../members/MemberClayGlyph';

type Props = {
  familyName: string;
  members: HouseholdMember[] | undefined;
  viewerRole: HouseholdMemberRole;
  hasPendingDeletion: boolean;
};

export function HouseholdHomeHeader({ familyName, members, viewerRole, hasPendingDeletion }: Props) {
  const countLine = members ? summarizeMemberCounts(members).summaryText : null;

  return (
    <header className="household-home-hero">
      <div className="household-home-hero-main">
        <div className="household-home-hero-emblem" aria-hidden="true">
          <MemberClayGlyph name="family-home" size={40} />
        </div>
        <div className="household-home-hero-copy">
          <div className="household-home-title-row">
            <h1 id="household-home-title">{familyName}</h1>
            <span
              className={
                hasPendingDeletion
                  ? 'household-home-status household-home-status-warning'
                  : 'household-home-status'
              }
            >
              <span className="household-home-status-dot" aria-hidden="true" />
              {hasPendingDeletion ? 'Đang chờ xoá' : 'Đang hoạt động'}
            </span>
          </div>
          {countLine && (
            <p className="household-home-count-line">
              <AdminIcon name="family_restroom" size={18} />
              <span>{countLine}</span>
            </p>
          )}
        </div>
      </div>
      {viewerRole === 'main' && (
        <Link to="/family/invite" className="household-home-invite-btn">
          <AdminIcon name="person_add" size={20} />
          <span>+ Mời người thân</span>
        </Link>
      )}
    </header>
  );
}
