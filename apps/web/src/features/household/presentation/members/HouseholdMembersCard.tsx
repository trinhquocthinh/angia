import { MemberClayGlyph } from './MemberClayGlyph';
import { Button } from '@src/shared/ui/button/Button';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { HouseholdMemberRow } from './HouseholdMemberRow';
import { HouseholdMembersEmpty } from './HouseholdMembersEmpty';
import { HouseholdMembersHeader } from './HouseholdMembersHeader';

type Props = {
  familyName: string;
  viewerRole: HouseholdMemberRole;
  members: HouseholdMember[] | undefined;
  isPending: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

export function HouseholdMembersCard({
  familyName,
  viewerRole,
  members,
  isPending,
  errorMessage,
  onRetry,
}: Props) {
  const onlySelf = members !== undefined && members.length <= 1;
  return (
    <section className="household-members" aria-labelledby="household-members-title">
      <HouseholdMembersHeader
        familyName={familyName}
        memberCount={members ? members.length : null}
        viewerRole={viewerRole}
      />
      {isPending && (
        <p role="status" className="household-members-status">
          Đang tải danh sách thành viên…
        </p>
      )}
      {errorMessage && (
        <div className="household-members-error">
          <p role="alert">{errorMessage}</p>
          <Button variant="secondary" onClick={onRetry}>
            Thử lại
          </Button>
        </div>
      )}
      {members && (
        <>
          <ul className="household-members-list">
            {members.map((member) => (
              <HouseholdMemberRow key={member.accountId} member={member} viewerRole={viewerRole} />
            ))}
          </ul>
          {onlySelf && <HouseholdMembersEmpty viewerRole={viewerRole} />}
        </>
      )}
      <p className="household-members-footnote">
        <span className="household-members-footnote-icon" aria-hidden="true">
          <MemberClayGlyph name="member-lock" size={16} />
        </span>
        <span>Chủ hộ và tài khoản của bạn được bảo vệ. Rời nhà nằm trong mục Tài khoản.</span>
      </p>
    </section>
  );
}
