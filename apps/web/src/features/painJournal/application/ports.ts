import type { PainIssueList, PainIssueQuery } from '@angia/contracts';

export interface PainJournalApi {
  /** null dùng hồ sơ liên kết trong phiên, không gửi ID hồ sơ từ client. */
  list(profileId: string | null, query: PainIssueQuery, signal?: AbortSignal): Promise<PainIssueList>;
}
