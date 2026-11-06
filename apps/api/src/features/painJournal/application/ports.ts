import type {
  BodyLocation,
  PainEntry as PainEntryDto,
  ExerciseNote as ExerciseNoteDto,
  PainContext,
  PainIssueDetail,
  PainIssueSummary,
  PainIssueDeletionImpact,
} from '@angia/contracts';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { PainIssue } from '../domain/painIssue.js';
import type { PainEntry } from '../domain/painEntry.js';
import type { ExerciseNote } from '../domain/exerciseNote.js';

export interface ProfileTarget {
  familyId: string;
  profileId: string;
}
export interface IssueTarget extends ProfileTarget {
  issueId: string;
}
export interface EntryTarget extends IssueTarget {
  entryId: string;
}
export interface ExerciseTarget extends IssueTarget {
  exerciseId: string;
}
// Presentation cấp các ID này từ phiên; cửa tự quản không nhận profileId từ client.
export interface PainIssueSession extends ProfileTarget {
  accountId: string;
}
export interface PainIssueAudit {
  accountId: string;
  at: Date;
}
export type PainIssueClock = () => Date;
export type PainIssueConflict = {
  ok: false;
  code: 'ERR_PAIN_ISSUE_EXISTS';
  details: { existingIssueId: string };
};
export type PainIssueWriteResult<T> = { ok: true; value: T } | PainIssueConflict;
export type PainIssueOutcome<T> =
  | PainIssueWriteResult<T>
  | {
      ok: false;
      code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' | 'ERR_VALIDATION' | 'ERR_INVALID_STATE_TRANSITION';
      details?: { fields: string[] } | { reason: 'last_entry' };
    };
export interface StoredPainIssue {
  issue: PainIssue;
  consentStatus: ConsentStatus;
  lastRecordedAt: string;
}
export interface NewPainIssue extends BodyLocation, PainIssueAudit {
  profileId: string;
  title: string | null;
  firstEntry: PainEntry;
}
export type PainIssueStatusChange = PainIssueAudit &
  (
    | { status: 'resolved'; resolvedOn: string; kind: 'resolved'; on: string }
    | { status: 'tracking'; resolvedOn: null; kind: 'reopened'; on: string }
  );
export interface PainIssueStore {
  findProfile(profileId: string): Promise<{ consentStatus: ConsentStatus } | null>;
  /** Lọc cả profileId/issueId; null nếu ngoài phạm vi. lock=true khóa FOR UPDATE trước khi đọc lần ghi cuối. */
  findIssue(profileId: string, issueId: string, lock: boolean): Promise<StoredPainIssue | null>;
  findTrackingIssue(
    profileId: string,
    location: Pick<PainIssue, 'region' | 'side'>,
    excludeIssueId?: string,
  ): Promise<string | null>;
  listIssues(profileId: string, status: 'tracking' | 'resolved' | 'all'): Promise<PainIssueSummary[]>;
  getDetail(profileId: string, issueId: string): Promise<PainIssueDetail | null>;
  /** Tạo tracking và lần ghi đầu nguyên tử; cùng createdBy/updatedBy từ accountId. */
  insertIssue(input: NewPainIssue): Promise<PainIssueWriteResult<PainIssueDetail>>;
  updateIssue(
    profileId: string,
    issueId: string,
    value: BodyLocation & { title: string | null },
    audit: PainIssueAudit,
  ): Promise<PainIssueWriteResult<PainIssueSummary>>;
  /** Cập nhật trạng thái/audit và INSERT sự kiện cùng transaction; giữ createdBy. */
  changeStatus(
    profileId: string,
    issueId: string,
    value: PainIssueStatusChange,
  ): Promise<PainIssueWriteResult<PainIssueSummary>>;
  countImpact(profileId: string, issueId: string): Promise<PainIssueDeletionImpact>;
  /** Mọi thao tác con lọc đồng thời profileId, issueId và ID con; ngoài phạm vi trả null.
   * Ghi con trong transaction đã khóa vấn đề; giữ createdBy khi sửa và cập nhật audit của con. */
  findEntry(profileId: string, issueId: string, entryId: string): Promise<PainEntryDto | null>;
  insertEntry(
    profileId: string,
    issueId: string,
    value: PainEntry,
    audit: PainIssueAudit,
  ): Promise<PainEntryDto>;
  updateEntry(
    profileId: string,
    issueId: string,
    entryId: string,
    value: PainEntry,
    audit: PainIssueAudit,
  ): Promise<PainEntryDto>;
  deleteEntry(profileId: string, issueId: string, entryId: string): Promise<void>;
  findExercise(profileId: string, issueId: string, exerciseId: string): Promise<ExerciseNoteDto | null>;
  insertExercise(
    profileId: string,
    issueId: string,
    value: ExerciseNote,
    audit: PainIssueAudit,
  ): Promise<ExerciseNoteDto>;
  updateExercise(
    profileId: string,
    issueId: string,
    exerciseId: string,
    value: ExerciseNote,
    audit: PainIssueAudit,
  ): Promise<ExerciseNoteDto>;
  deleteExercise(profileId: string, issueId: string, exerciseId: string): Promise<void>;
  /** MIN(recorded_at) hiện có của đúng vấn đề/hồ sơ; null nếu không còn vấn đề. */
  firstRecordedAt(profileId: string, issueId: string): Promise<string | null>;
  /** Chỉ cùng hồ sơ: liều trong [đầu ngày from, đầu ngày sau to) giờ VN và đợt giao [from,to].
   * Không ẩn theo BR-049; không phân tích liên hệ với cơn đau. */
  readContext(
    profileId: string,
    from: string,
    to: string,
  ): Promise<Pick<PainContext, 'asNeededDoses' | 'courses'>>;
  /** Xóa cha; FK cascade xóa lần ghi, bài tập và sự kiện. */
  deleteIssue(profileId: string, issueId: string): Promise<void>;
}
export interface PainIssueRepository {
  /** Một transaction dùng FamilyScope; repository tự quản được gắn SelfScope từ phiên tại infrastructure.
   * Lệnh ghi ánh xạ unique conflict thành PainIssueConflict, không commit từng phần khi trả lỗi. */
  withFamily<T>(familyId: string, work: (store: PainIssueStore) => Promise<T>): Promise<T>;
}
