import type { ApprovePrivacyRequest, PrivacyDraft, PrivacyEdits } from '@angia/contracts';
import type { SourceDocument } from './reviewPorts';
export interface PrivacyRepository {
  read(id: string, signal?: AbortSignal): Promise<PrivacyDraft>;
  create(id: string, edits: PrivacyEdits, csrfToken: string): Promise<PrivacyDraft>;
  approve(id: string, body: ApprovePrivacyRequest, csrfToken: string): Promise<SourceDocument>;
  manual(id: string, csrfToken: string): Promise<SourceDocument>;
}
