import type { HouseholdMember } from '../../application/memberPorts';
import { HouseholdMemberRoleBadge } from './HouseholdMemberRoleBadge';
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
        <HouseholdMemberRoleBadge member={member} />
      </div>
      <h1 id="member-detail-name">{member.displayName}</h1>
    </header>
  );
}
