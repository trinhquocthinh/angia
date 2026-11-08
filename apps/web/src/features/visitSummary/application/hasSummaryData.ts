import type { VisitSummary } from '@angia/contracts';

// E6-S1-T2 + SPEC-024 v0.3: màn "Chưa đủ dữ liệu" chỉ khi cả năm mục rỗng.
export const hasSummaryData = (summary: VisitSummary) =>
  summary.currentMedications.length +
    summary.measurements.length +
    summary.latestLabResults.length +
    summary.adherencePeriods.length +
    summary.painIssues.length >
  0;
