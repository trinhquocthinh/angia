import { MemberClayGlyph } from './MemberClayGlyph';
import type { HouseholdMember, HouseholdMemberRole } from '../../application/memberPorts';
import { HouseholdMemberRow } from './HouseholdMemberRow';
import { HouseholdMembersEmpty } from './HouseholdMembersEmpty';

type Props = {
  members: HouseholdMember[];
  viewerRole: HouseholdMemberRole;
  selectedId: string | null;
  onSelect: (accountId: string, trigger: HTMLButtonElement) => void;
};

export function HouseholdMembersList({ members, viewerRole, selectedId, onSelect }: Props) {
  return (
    <div className="household-members-rail">
      <div className="household-members-rail-head">
        <div className="household-members-rail-title">
          <MemberClayGlyph name="family" size={22} />
          <h2 id="household-members-section-title">Thành viên &amp; Phân quyền</h2>
        </div>
        {viewerRole === 'main' && (
          <span className="household-members-rail-hint">Chạm để xem &amp; sửa quyền</span>
        )}
      </div>
      <ul className="household-members-list">
        {members.map((member) => (
          <HouseholdMemberRow
            key={member.accountId}
            member={member}
            viewerRole={viewerRole}
            selected={selectedId === member.accountId}
            onSelect={onSelect}
          />
        ))}
      </ul>
      {members.length <= 1 && <HouseholdMembersEmpty viewerRole={viewerRole} />}
    </div>
  );
}
