export function painIssueResolveDates(lastRecordedAt: string, now = new Date()) {
  const min = new Date(Date.parse(lastRecordedAt) + 7 * 3_600_000).toISOString().slice(0, 10);
  const max = new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
  return { min, max };
}
