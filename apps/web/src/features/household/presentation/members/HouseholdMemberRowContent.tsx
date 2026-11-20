import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { HouseholdMember } from '../../application/memberPorts';
import { HouseholdMemberRoleBadge } from './HouseholdMemberRoleBadge';
import { MemberAvatar } from './MemberAvatar';
import { MemberClayGlyph } from './MemberClayGlyph';

type Props = { member: HouseholdMember; manageable: boolean; selected: boolean };

export function HouseholdMemberRowContent({ member, manageable, selected }: Props) {
  return (
    <>
      <div className="household-member-row-main">
        <MemberAvatar member={member} />
        <div className="household-member-row-identity">
          <span className="household-member-name">{member.displayName}</span>
          {member.isSelf && <span className="household-member-self-badge">Bạn</span>}
          {manageable && selected && <span className="household-member-selected-badge">Đang chọn</span>}
        </div>
      </div>
      <div className="household-member-row-meta">
        <HouseholdMemberRoleBadge member={member} />
        {(manageable || member.isOwner || member.isSelf) && (
          <span
            className="household-member-chevron"
            title={member.isOwner ? 'Chủ hộ được bảo vệ' : member.isSelf ? 'Tài khoản của bạn' : undefined}
            aria-label={
              member.isOwner ? 'Chủ hộ được bảo vệ' : member.isSelf ? 'Tài khoản của bạn' : undefined
            }
            role={manageable ? undefined : 'img'}
            aria-hidden={manageable ? true : undefined}
          >
            {manageable ? (
              <AdminIcon name={selected ? 'arrow_forward' : 'chevron_right'} size={20} />
            ) : (
              <MemberClayGlyph name={member.isOwner ? 'member-protected' : 'member-lock'} size={16} />
            )}
          </span>
        )}
      </div>
    </>
  );
}
