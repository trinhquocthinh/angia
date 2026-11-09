import type { ReactNode } from 'react';
import type { PainIssueSummary } from '@angia/contracts';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
type Props = {
  issue: PainIssueSummary;
  onBack: () => void;
  actions?: ReactNode;
};
export function PainIssueDetailHeader({ issue, onBack, actions }: Props) {
  return (
    <header className="space-y-2">
      <button type="button" onClick={onBack} className="min-h-11 underline">
        ‹ Đau nhức
      </button>
      <h1 className="text-2xl font-semibold">{describeBodyLocation(issue)}</h1>
      {issue.title && <p className="break-words text-text-secondary">{issue.title}</p>}
      <p>
        {issue.status === 'tracking'
          ? 'Đang theo dõi'
          : `Đã khỏi từ ${issue.resolvedOn?.split('-').reverse().join('/')}`}
      </p>
      {actions}
    </header>
  );
}
