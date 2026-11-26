import { Link } from '@tanstack/react-router';
import { ProfileSectionIcon, type ProfileSectionIconName } from './ProfileSectionIcon';
import { canManageProfileGuardians } from '../../application/canManageProfileGuardians';
import { profileShowsVitals } from '../../application/profileShowsVitals';
import type { ProfileListItem, ProfileSession } from '../../application/ports';

const sections: ReadonlyArray<{
  to:
    | '/profiles/$profileId/medications'
    | '/profiles/$profileId/reminders'
    | '/profiles/$profileId'
    | '/profiles/$profileId/lab-results'
    | '/profiles/$profileId/pain'
    | '/profiles/$profileId/timeline'
    | '/profiles/$profileId/revisits'
    | '/profiles/$profileId/documents'
    | '/profiles/$profileId/prescriptions'
    | '/profiles/$profileId/manual'
    | '/profiles/$profileId/guardians';
  label: string;
  icon: ProfileSectionIconName;
}> = [
  { to: '/profiles/$profileId/medications', label: 'Thuốc đang dùng', icon: 'medication' },
  { to: '/profiles/$profileId/reminders', label: 'Nhắc thuốc', icon: 'notifications' },
  { to: '/profiles/$profileId', label: 'Diễn biến sức khỏe', icon: 'monitor_heart' },
  { to: '/profiles/$profileId/lab-results', label: 'Kết quả xét nghiệm', icon: 'science' },
  { to: '/profiles/$profileId/pain', label: 'Sổ đau nhức', icon: 'accessibility_new' },
  { to: '/profiles/$profileId/timeline', label: 'Dòng thời gian', icon: 'history' },
  { to: '/profiles/$profileId/revisits', label: 'Lịch tái khám', icon: 'event' },
  { to: '/profiles/$profileId/documents', label: 'Giấy tờ khám', icon: 'folder_open' },
  { to: '/profiles/$profileId/prescriptions', label: 'Chuỗi đơn thuốc', icon: 'receipt_long' },
  { to: '/profiles/$profileId/manual', label: 'Nhập tay trực tiếp', icon: 'edit_note' },
  { to: '/profiles/$profileId/guardians', label: 'Người giám hộ', icon: 'supervisor_account' },
];

export function ProfileDirectory({
  profile,
  session,
}: {
  profile: ProfileListItem;
  session: ProfileSession;
}) {
  return (
    <section className="flex flex-col gap-3.5" aria-labelledby="profile-directory-title">
      <h2 id="profile-directory-title" className="auth-heading px-1 text-heading-2 font-semibold text-accent">
        Mục lục sức khỏe
      </h2>
      <nav aria-label="Mục lục sức khỏe" className="profile-bento-grid">
        {sections
          .filter(
            (item) =>
              (item.to !== '/profiles/$profileId' || profileShowsVitals(profile)) &&
              (item.to !== '/profiles/$profileId/guardians' || canManageProfileGuardians(profile, session)),
          )
          .map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={{ profileId: profile.id }}
              search={item.to === '/profiles/$profileId' ? { section: 'health' } : {}}
              className="profile-bento-tile"
            >
              <ProfileSectionIcon name={item.icon} size={48} />
              <span className="profile-bento-tile-label">{item.label}</span>
            </Link>
          ))}
      </nav>
    </section>
  );
}
