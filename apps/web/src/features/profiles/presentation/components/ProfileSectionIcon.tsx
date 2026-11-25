const ICON_SRC = {
  medication: '/images/profile-sections/medications-3d.png',
  notifications: '/images/account-menu/notification-bell-3d.png',
  monitor_heart: '/images/profile-sections/health-3d.png',
  science: '/images/profile-sections/lab-results-3d.png',
  thermostat: '/images/profile-sections/temperatures-3d.png',
  accessibility_new: '/images/profile-sections/pain-3d.png',
  history: '/images/profile-sections/timeline-3d.png',
  event: '/images/profile-sections/revisits-3d.png',
  folder_open: '/images/profile-sections/documents-3d.png',
  receipt_long: '/images/profile-sections/prescriptions-3d.png',
  edit_note: '/images/profile-sections/manual-3d.png',
  supervisor_account: '/images/profile-sections/guardians-3d.png',
} as const;

export type ProfileSectionIconName = keyof typeof ICON_SRC;

export function ProfileSectionIcon({ name, size = 48 }: { name: ProfileSectionIconName; size?: number }) {
  return (
    <img
      src={ICON_SRC[name]}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="profile-clay-icon"
      style={{ width: size, height: size }}
    />
  );
}
