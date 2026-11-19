import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

export function MemberDetailBreadcrumb({ displayName }: { displayName: string | null }) {
  return (
    <nav className="household-member-breadcrumb" aria-label="Đường dẫn">
      <Link to="/family/members" aria-label="Quay lại danh sách thành viên" className="household-member-back">
        <AdminIcon name="arrow_back" size={20} />
      </Link>
      <Link to="/family/members" className="household-member-crumb-link">
        Thành viên
      </Link>
      {displayName && (
        <>
          <span className="household-member-crumb-sep" aria-hidden="true">
            /
          </span>
          <span className="household-member-crumb-current" aria-current="page">
            {displayName}
          </span>
        </>
      )}
    </nav>
  );
}
