import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { HouseholdMemberRole } from '../../application/memberPorts';

type Props = {
  familyName: string;
  memberCount: number | null;
  viewerRole: HouseholdMemberRole;
};

export function HouseholdMembersHeader({ familyName, memberCount, viewerRole }: Props) {
  const subtitle = memberCount === null ? familyName : `${familyName} · ${memberCount} thành viên`;
  return (
    <header className="household-members-header">
      <div className="household-members-topbar">
        <span className="household-members-family-pill">
          <AdminIcon name="home_health" size={18} />
          <span>{subtitle}</span>
        </span>
        <Link to="/" aria-label="Quay lại" className="household-members-back">
          <AdminIcon name="arrow_back" size={20} />
        </Link>
      </div>
      <div className="household-members-title-row">
        <div>
          <h1 id="household-members-title">Thành viên trong nhà</h1>
          <p className="household-members-subtitle">
            {viewerRole === 'main'
              ? 'Quản lý quyền hạn và danh sách người thân trong nhà.'
              : 'Danh sách người thân trong nhà.'}
          </p>
        </div>
        {viewerRole === 'main' && (
          <Link to="/family/invite" className="household-members-invite-btn">
            <AdminIcon name="person_add" size={20} />
            <span>+ Mời người thân</span>
          </Link>
        )}
      </div>
    </header>
  );
}
