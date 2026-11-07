import type {
  CreatePainIssueRequest,
  PainIssueDetail,
  PainIssueList,
  PainIssueQuery,
  CreatePainEntryRequest,
  PainEntry,
  PainIssueSummary,
  UpdatePainEntryRequest,
  PainContext,
  PainContextQuery,
  ExerciseNote,
  CreateExerciseNoteRequest,
  UpdateExerciseNoteRequest,
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

export interface PainEntryWriter {
  record(
    profileId: string | null,
    issueId: string,
    body: CreatePainEntryRequest,
    csrf: string,
    signal?: AbortSignal,
  ): Promise<PainEntry>;
  reopen(
    profileId: string | null,
    issueId: string,
    csrf: string,
    signal?: AbortSignal,
  ): Promise<PainIssueSummary>;
}
export interface PainIssueReader {
  detail(profileId: string | null, issueId: string, signal?: AbortSignal): Promise<PainIssueDetail>;
}

export interface PainContextReader {
  context(
    profileId: string | null,
    issueId: string,
    range: PainContextQuery,
    signal?: AbortSignal,
  ): Promise<PainContext>;
}

export interface PainEntryEditor {
  updateEntry(
    profileId: string | null,
    issueId: string,
    entryId: string,
    body: UpdatePainEntryRequest,
    csrf: string,
    signal?: AbortSignal,
  ): Promise<PainEntry>;
  deleteEntry(
    profileId: string | null,
    issueId: string,
    entryId: string,
    csrf: string,
    signal?: AbortSignal,
  ): Promise<void>;
}

export interface ExerciseNoteWriter {
  createExercise(
    profileId: string | null,
    issueId: string,
    body: CreateExerciseNoteRequest,
    csrf: string,
    signal?: AbortSignal,
  ): Promise<ExerciseNote>;
  updateExercise(
    profileId: string | null,
    issueId: string,
    exerciseId: string,
    body: UpdateExerciseNoteRequest,
    csrf: string,
    signal?: AbortSignal,
  ): Promise<ExerciseNote>;
}
