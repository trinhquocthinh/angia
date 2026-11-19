import { MemberClayGlyph } from './MemberClayGlyph';
import type { HouseholdMember } from '../../application/memberPorts';

export function MemberAvatar({
  member,
  size = 'md',
}: {
  member: Pick<HouseholdMember, 'displayName' | 'isOwner' | 'role'>;
  size?: 'md' | 'lg';
}) {
  const tone = member.isOwner ? 'owner' : member.role === 'main' ? 'main' : 'member';
  return (
    <span
      className={`household-member-avatar household-member-avatar-${size}`}
      data-tone={tone}
      aria-hidden="true"
    >
      <MemberClayGlyph name={`member-avatar-${tone}`} size={size === 'lg' ? 96 : 44} />
    </span>
  );
}
