import { z } from 'zod';
import { errorResponseSchema } from '@angia/contracts';
import { PainJournalRequestError } from '../application/PainJournalRequestError';
const detailsSchema = z.object({ existingIssueId: z.uuid() });
export function readPainJournalResponse(result: { response: Response; data?: unknown; error?: unknown }) {
  if (result.response.ok) return result.data;
  const parsed = errorResponseSchema.safeParse(result.error);
  const error = parsed.success && result.response.status < 500 ? parsed.data.error : undefined;
  const details = detailsSchema.safeParse(error?.details);
  throw new PainJournalRequestError(
    error?.message ?? 'Không thể lưu vấn đề đau. Vui lòng thử lại.',
    result.response.status,
    error?.code,
    result.response.status === 409 && error?.code === 'ERR_PAIN_ISSUE_EXISTS' && details.success
      ? details.data.existingIssueId
      : undefined,
  );
}
