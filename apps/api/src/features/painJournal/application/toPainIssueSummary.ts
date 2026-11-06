import type { PainIssueSummary } from '@angia/contracts';
import { toPainActor } from './toPainActor.js';

// Chỉ xuất trường trong hợp đồng, không trải dữ liệu nội bộ/nhận định từ repository.
export function toPainIssueSummary(issue: PainIssueSummary): PainIssueSummary {
  return {
    id: issue.id,
    region: issue.region,
    side: issue.side,
    title: issue.title,
    status: issue.status,
    resolvedOn: issue.resolvedOn,
    lastEntry: { level: issue.lastEntry.level, recordedAt: issue.lastEntry.recordedAt },
    entryCount: issue.entryCount,
    exerciseCount: issue.exerciseCount,
    createdBy: toPainActor(issue.createdBy),
    updatedBy: toPainActor(issue.updatedBy),
    updatedAt: issue.updatedAt,
  };
}
