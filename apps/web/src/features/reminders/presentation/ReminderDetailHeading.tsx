import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

export function ReminderDetailHeading({
  title,
  subtitle,
  revisit = false,
}: {
  title: string;
  subtitle?: string | undefined;
  revisit?: boolean;
}) {
  return (
    <header className="flex items-center gap-4">
      <span className="reminder-clay-emblem" aria-hidden="true">
        <ProfileSectionIcon name={revisit ? 'event' : 'notifications'} size={44} />
      </span>
      <div className="min-w-0 space-y-1">
        <h1 className="auth-heading text-heading-1 font-semibold tracking-tight text-accent">{title}</h1>
        {subtitle && <p className="text-body text-text-secondary">{subtitle}</p>}
      </div>
    </header>
  );
}
