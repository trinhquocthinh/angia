import type { HouseholdMember } from '../../application/memberPorts';
import { memberRoleLabel } from '../../application/memberDisplay';
import { MemberClayGlyph } from './MemberClayGlyph';
import { MemberAvatar } from './MemberAvatar';

export function MemberProfileHead({
  member,
}: {
  member: Pick<HouseholdMember, 'displayName' | 'isOwner' | 'role'>;
}) {
  return (
    <header className="household-member-profile-head">
      <div className="household-member-avatar-stack">
        <MemberAvatar member={member} size="lg" />
        <span className="household-member-profile-role" data-role={member.role}>
          <MemberClayGlyph name={member.role === 'main' ? 'role-main' : 'role-member'} size={14} />
          {memberRoleLabel(member)}
        </span>
      </div>
      <h1 id="member-detail-name">{member.displayName}</h1>
    </header>
  );
}
