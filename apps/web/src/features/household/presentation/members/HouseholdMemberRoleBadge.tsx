import { MemberClayGlyph } from './MemberClayGlyph';
import { memberRoleLabel } from '../../application/memberDisplay';
import type { HouseholdMember } from '../../application/memberPorts';

export function HouseholdMemberRoleBadge({ member }: { member: Pick<HouseholdMember, 'isOwner' | 'role'> }) {
  const tone = member.isOwner ? 'owner' : member.role === 'main' ? 'main' : 'member';
  return (
    <span className="household-member-role-badge" data-tone={tone}>
      <MemberClayGlyph name={`role-${tone}`} size={14} />
      <span>{memberRoleLabel(member)}</span>
    </span>
  );
}
