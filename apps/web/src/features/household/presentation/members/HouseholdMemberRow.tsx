import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { canManageMember } from '../../application/memberDisplay';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { HouseholdMemberRoleBadge } from './HouseholdMemberRoleBadge';
import { MemberAvatar } from './MemberAvatar';

export function HouseholdMemberRow({
  member,
  viewerRole,
}: {
  member: HouseholdMember;
  viewerRole: HouseholdMemberRole;
}) {
  const manageable = canManageMember(viewerRole, member);
  const body = (
    <>
      <div className="household-member-row-main">
        <MemberAvatar member={member} />
        <div className="household-member-row-identity">
          <span className="household-member-name">{member.displayName}</span>
          {member.isSelf && <span className="household-member-self-badge">Bạn</span>}
        </div>
      </div>
      <div className="household-member-row-meta">
        <HouseholdMemberRoleBadge member={member} />
        {manageable && (
          <span className="household-member-chevron" aria-hidden="true">
            <AdminIcon name="chevron_right" size={20} />
          </span>
        )}
      </div>
    </>
  );

  return (
    <li className="household-member-item">
      {manageable ? (
        <Link
          to="/family/members/$accountId"
          params={{ accountId: member.accountId }}
          className="household-member-row household-member-row-link"
        >
          {body}
        </Link>
      ) : (
        <div className="household-member-row">{body}</div>
      )}
    </li>
  );
}
