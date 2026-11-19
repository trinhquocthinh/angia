import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';

export function MemberProtectedNotice({ message }: { message: string }) {
  return (
    <section className="household-member-detail-card household-member-protected" aria-live="polite">
      <span className="household-member-protected-icon" aria-hidden="true">
        <AdminIcon name="shield" size={28} />
      </span>
      <p className="household-member-protected-text">{message}</p>
      <Link to="/family/members" className="household-member-return-link">
        Quay lại danh sách thành viên
      </Link>
    </section>
  );
}
