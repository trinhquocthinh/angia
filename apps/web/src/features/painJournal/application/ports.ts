import type {
  CreatePainIssueRequest,
  PainIssueDetail,
  PainIssueList,
  PainIssueQuery,
} from '@angia/contracts';

export interface PainJournalApi {
  /** null dùng hồ sơ liên kết trong phiên, không gửi ID hồ sơ từ client. */
  list(profileId: string | null, query: PainIssueQuery, signal?: AbortSignal): Promise<PainIssueList>;
}

export interface PainIssueWriter {
  /** null chọn hồ sơ liên kết; không truyền định danh hồ sơ trong body tự quản. */
  create(
    profileId: string | null,
    body: CreatePainIssueRequest,
    csrf: string,
    signal?: AbortSignal,
  ): Promise<PainIssueDetail>;
}
