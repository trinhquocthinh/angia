import { z } from 'zod';
import { createPainEntryRequestSchema, painJournalLimits } from '@angia/contracts';
export function newPainIssueFormSchema(now = new Date()) {
  return z
    .object({
      title: z.string().max(painJournalLimits.titleLength, 'Tên ngắn tối đa 60 ký tự.'),
      level: z.number().int().min(1).max(10),
      note: z.string().max(painJournalLimits.entryNoteLength, 'Ghi chú tối đa 500 ký tự.'),
      recordedAt: z.string().refine((value) => {
        if (!value) return true;
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
        const time = Date.parse(`${value}+07:00`);
        return (
          Number.isFinite(time) &&
          time <= now.getTime() &&
          new Date(time + 7 * 3_600_000).toISOString().slice(0, 16) === value
        );
      }, 'Nhập ngày giờ hợp lệ theo giờ Việt Nam, không ở tương lai.'),
    })
    .transform(({ title, level, note, recordedAt }) => ({
      title,
      firstEntry: createPainEntryRequestSchema.parse({
        level,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(recordedAt ? { recordedAt: new Date(`${recordedAt}+07:00`).toISOString() } : {}),
      }),
    }));
}
