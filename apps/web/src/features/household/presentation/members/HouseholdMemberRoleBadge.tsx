import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { memberRoleLabel } from '../../application/memberDisplay';
import type { HouseholdMember } from '../../application/memberPorts';

export function HouseholdMemberRoleBadge({ member }: { member: Pick<HouseholdMember, 'isOwner' | 'role'> }) {
  const tone = member.isOwner ? 'owner' : member.role === 'main' ? 'main' : 'member';
  const icon = member.isOwner ? 'verified_user' : member.role === 'main' ? 'shield' : 'person';
  return (
    <span className="household-member-role-badge" data-tone={tone}>
      <AdminIcon name={icon} size={16} />
      <span>{memberRoleLabel(member)}</span>
    </span>
  );
}
