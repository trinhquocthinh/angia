import type { BodyLocation, PainIssueSummary } from '@angia/contracts';
export function findTrackingPainIssue(issues: PainIssueSummary[], location: BodyLocation) {
  return issues.find(
    (issue) =>
      issue.status === 'tracking' && issue.region === location.region && issue.side === location.side,
  );
}
