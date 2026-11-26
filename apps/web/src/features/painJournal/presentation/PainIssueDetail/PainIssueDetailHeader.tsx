import type { ReactNode } from 'react';
import type { PainIssueSummary } from '@angia/contracts';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
type Props = {
  issue: PainIssueSummary;
  onBack: () => void;
  actions?: ReactNode;
};
export function PainIssueDetailHeader({ issue, onBack, actions }: Props) {
  const tracking = issue.status === 'tracking';
  return (
    <header className="profile-bento-card flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full border border-border/45 bg-bg px-4 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft"
        >
          ‹ Đau nhức
        </button>
        {actions}
      </div>
      <div className="flex flex-wrap items-start gap-3.5">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
          <ProfileSectionIcon name="accessibility_new" size={38} />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="auth-heading text-heading-1 font-semibold text-accent">
              {describeBodyLocation(issue)}
            </h1>
            <p
              className={`rounded-full px-3 py-0.5 text-caption font-semibold tabular-nums ${
                tracking
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-surface-container text-text-secondary'
              }`}
            >
              {tracking ? 'Đang theo dõi' : `Đã khỏi từ ${issue.resolvedOn?.split('-').reverse().join('/')}`}
            </p>
          </div>
          {issue.title && <p className="break-words text-body text-text-secondary">{issue.title}</p>}
        </div>
      </div>
    </header>
  );
}
