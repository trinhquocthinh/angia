import type { UpdatePainEntryRequest } from '@angia/contracts';
import { newPainIssueFormSchema } from './newPainIssueForm';

export function editPainEntryForm(
  values: { level: number | null; recordedAt: string; note: string },
  resolvedOn: string | null,
  now = new Date(),
  originalRecordedAt?: string,
): UpdatePainEntryRequest {
  const parsed = newPainIssueFormSchema(now).parse({ ...values, title: '' }).firstEntry;
  if (!values.recordedAt) throw new Error('Vui lòng nhập thời điểm lần ghi.');
  if (resolvedOn && values.recordedAt.slice(0, 10) > resolvedOn)
    throw new Error('Thời điểm lần ghi không được sau ngày đã khỏi theo giờ Việt Nam.');
  if (
    originalRecordedAt &&
    values.recordedAt === new Date(Date.parse(originalRecordedAt) + 7 * 3_600_000).toISOString().slice(0, 16)
  )
    delete parsed.recordedAt;
  return { ...parsed, note: values.note.trim() || null };
}
