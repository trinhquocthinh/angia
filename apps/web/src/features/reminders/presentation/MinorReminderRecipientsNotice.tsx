import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

// Hồ sơ trẻ chưa liên kết: người nhận nhắc chính là các người giám hộ (SPEC-070, API PUT trả 422).
export function MinorReminderRecipientsNotice({ profileId }: { profileId: string }) {
  return (
    <section aria-label="Người nhận nhắc" className="reminder-card flex flex-col gap-4 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="reminder-section-tile" aria-hidden="true">
            <ProfileSectionIcon name="supervisor_account" size={30} />
          </span>
          <div className="min-w-0">
            <h2 className="auth-heading text-heading-2 font-semibold text-text-primary">Người nhận nhắc</h2>
            <p className="text-caption text-text-secondary">Hồ sơ trẻ dưới 18 tuổi</p>
          </div>
        </div>
        <span className="reminder-pill">Người giám hộ</span>
      </div>
      <div className="reminder-callout text-body">
        <AdminIcon name="shield" size={20} />
        <p>Người nhận nhắc của hồ sơ trẻ là các người giám hộ.</p>
      </div>
      <Link to="/profiles/$profileId/guardians" params={{ profileId }} className="reminder-secondary-link">
        <span>Xem người giám hộ</span>
        <AdminIcon name="arrow_forward" size={18} />
      </Link>
    </section>
  );
}
