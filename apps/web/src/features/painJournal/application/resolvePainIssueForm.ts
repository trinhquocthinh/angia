import { resolvePainIssueRequestSchema } from '@angia/contracts';
import { painIssueResolveDates } from './painIssueResolveDates';
export function resolvePainIssueForm(resolvedOn: string, lastRecordedAt: string, now = new Date()) {
  const body = resolvePainIssueRequestSchema.parse({ resolvedOn });
  const { min, max } = painIssueResolveDates(lastRecordedAt, now);
  if (resolvedOn < min || resolvedOn > max)
    throw new Error('Ngày khỏi phải từ ngày lần ghi muộn nhất đến hôm nay theo giờ Việt Nam.');
  return body;
}
