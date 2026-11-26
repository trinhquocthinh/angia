import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

type Props = {
  profileId: string;
  displayName: string;
  activeSlotCount: number | null;
};

export function ReminderSettingsHeader({ profileId, displayName, activeSlotCount }: Props) {
  const slotSummary =
    activeSlotCount === null
      ? null
      : activeSlotCount > 0
        ? `${activeSlotCount} buổi đang bật`
        : 'Chưa đặt khung giờ';
  return (
    <header className="flex flex-col gap-4">
      <Link to="/profiles/$profileId" params={{ profileId }} className="reminder-back-link">
        <AdminIcon name="arrow_back" size={20} />
        <span>Quay lại hồ sơ {displayName}</span>
      </Link>
      <div className="reminder-hero-card flex flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center md:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="reminder-clay-emblem" aria-hidden="true">
            <ProfileSectionIcon name="notifications" size={44} />
          </span>
          <div className="min-w-0 space-y-1">
            <h1 className="auth-heading text-heading-1 font-semibold tracking-tight text-accent">
              Nhắc thuốc
            </h1>
            <p className="break-words text-body text-text-secondary">
              Thiết lập khung giờ và người nhận lời nhắc cho {displayName}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
          <span className="reminder-pill">
            <span className="reminder-ceramic-avatar reminder-ceramic-avatar-xs" aria-hidden="true">
              {displayName.slice(0, 1)}
            </span>
            <span className="min-w-0 truncate">{displayName}</span>
          </span>
          {slotSummary && (
            <span className={`reminder-pill tabular-nums ${activeSlotCount ? '' : 'reminder-pill-muted'}`}>
              {slotSummary}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
