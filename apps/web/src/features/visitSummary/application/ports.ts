import type { VisitSummary } from '@angia/contracts';
import type { SummaryRange } from './summaryRange';

export interface VisitSummaryRepository {
  /** SPEC-024: dữ liệu đã duyệt của hồ sơ trong khoảng, kèm ngày tạo và dòng miễn trừ. */
  get(profileId: string, range: SummaryRange, signal?: AbortSignal): Promise<VisitSummary>;
}
