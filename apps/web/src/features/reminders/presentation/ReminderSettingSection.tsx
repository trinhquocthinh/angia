import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { useId } from 'react';
import {
  ProfileSectionIcon,
  type ProfileSectionIconName,
} from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { Button } from '@src/shared/ui/button/Button';

type Props<T> = {
  title: string;
  subtitle?: string | undefined;
  icon?: ProfileSectionIconName | undefined;
  badge?: string | undefined;
  query: UseQueryResult<T>;
  loadingText: string;
  children: (data: T) => ReactNode;
};

// Một mục cấu hình nhắc thuốc trên trang /profiles/:id/reminders: đầu thẻ Clay Bento, trạng thái tải/lỗi.
export function ReminderSettingSection<T>({
  title,
  subtitle,
  icon = 'notifications',
  badge,
  query,
  loadingText,
  children,
}: Props<T>) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="reminder-card flex min-w-0 flex-col gap-5 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="reminder-section-tile" aria-hidden="true">
            <ProfileSectionIcon name={icon} size={30} />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="auth-heading text-heading-2 font-semibold text-text-primary">
              {title}
            </h2>
            {subtitle && <p className="text-caption text-text-secondary">{subtitle}</p>}
          </div>
        </div>
        {badge && <span className="reminder-pill tabular-nums">{badge}</span>}
      </div>
      {query.isPending ? (
        <div role="status" className="flex flex-col gap-3 rounded-2xl bg-bg p-4">
          <p className="text-caption font-medium text-text-secondary">{loadingText}</p>
          <span className="reminder-skeleton-bar w-3/4" aria-hidden="true" />
          <span className="reminder-skeleton-bar w-1/2" aria-hidden="true" />
        </div>
      ) : query.isError ? (
        <div role="alert" className="reminder-callout reminder-callout-danger flex-col gap-3 text-body">
          <p className="font-medium">{query.error.message}</p>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Thử lại
          </Button>
        </div>
      ) : (
        children(query.data)
      )}
    </section>
  );
}
