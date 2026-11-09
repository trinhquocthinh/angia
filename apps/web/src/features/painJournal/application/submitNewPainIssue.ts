import { createPainIssueRequestSchema, type CreatePainIssueRequest } from '@angia/contracts';
import { PainJournalRequestError } from './PainJournalRequestError';
import type { PainIssueWriter } from './ports';
import type { PainIssueHandoff } from './painIssueHandoff';
export async function submitNewPainIssue(
  api: PainIssueWriter,
  profileId: string | null,
  request: CreatePainIssueRequest,
  csrf: string,
  signal?: AbortSignal,
): Promise<PainIssueHandoff> {
  const body = createPainIssueRequestSchema.parse(request);
  try {
    const issue = await api.create(profileId, body, csrf, signal);
    return { kind: 'created', issueId: issue.id };
  } catch (error) {
    if (
      error instanceof PainJournalRequestError &&
      error.status === 409 &&
      error.code === 'ERR_PAIN_ISSUE_EXISTS' &&
      error.existingIssueId
    ) {
      return {
        kind: 'existing',
        issueId: error.existingIssueId,
        draft: body.firstEntry,
        message: 'Vùng này đang có vấn đề đang theo dõi. Mức bạn chấm sẽ được ghi vào vấn đề đó.',
      };
    }
    throw error;
  }
}
