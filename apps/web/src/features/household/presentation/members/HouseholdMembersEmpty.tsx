import { Link } from '@tanstack/react-router';
import { MemberClayGlyph } from './MemberClayGlyph';
import type { HouseholdMemberRole } from '../../application/memberPorts';

export function HouseholdMembersEmpty({ viewerRole }: { viewerRole: HouseholdMemberRole }) {
  return (
    <div className="household-members-empty">
      <p className="household-members-empty-title">Mới có mình bạn</p>
      {viewerRole === 'main' && (
        <Link to="/family/invite" className="household-members-invite-btn">
          <MemberClayGlyph name="invite-add" size={20} />
          <span>Mời người thân</span>
        </Link>
      )}
    </div>
  );
}
