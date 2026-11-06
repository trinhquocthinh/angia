import type {
  BodyLocation,
  PainIssueDetail,
  PainIssueSummary,
  PainIssueDeletionImpact,
} from '@angia/contracts';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import type { PainIssue } from '../domain/painIssue.js';
import type { PainEntry } from '../domain/painEntry.js';

export interface ProfileTarget {
  familyId: string;
  profileId: string;
}
export interface IssueTarget extends ProfileTarget {
  issueId: string;
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
      details?: { fields: string[] };
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
  /** Xóa cha; FK cascade xóa lần ghi, bài tập và sự kiện. */
  deleteIssue(profileId: string, issueId: string): Promise<void>;
}
export interface PainIssueRepository {
  /** Một transaction dùng FamilyScope; repository tự quản được gắn SelfScope từ phiên tại infrastructure.
   * Lệnh ghi ánh xạ unique conflict thành PainIssueConflict, không commit từng phần khi trả lỗi. */
  withFamily<T>(familyId: string, work: (store: PainIssueStore) => Promise<T>): Promise<T>;
}
