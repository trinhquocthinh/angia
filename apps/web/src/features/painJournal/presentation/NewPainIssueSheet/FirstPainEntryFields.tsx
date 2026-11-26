import { FirstPainEntryTime } from './FirstPainEntryTime';
import { useId } from 'react';
import type { FirstEntryFieldsProps } from './newPainIssueTypes';
import { FirstPainEntryLevel } from './FirstPainEntryLevel';
export function FirstPainEntryFields({ values, onChange }: FirstEntryFieldsProps) {
  const id = useId();
  return (
    <div className="space-y-4">
      <FirstPainEntryLevel values={values} onChange={onChange} />
      <label
        className="flex flex-col gap-1.5 text-caption font-semibold text-text-secondary"
        htmlFor={`${id}-note`}
      >
        Ghi chú (tùy chọn)
        <textarea
          id={`${id}-note`}
          rows={3}
          maxLength={500}
          placeholder="Thêm mô tả về hoàn cảnh hoặc biểu hiện kèm theo…"
          value={values.note}
          onChange={(event) => onChange({ note: event.target.value })}
          aria-describedby={`${id}-count`}
          className="rounded-2xl border border-border/55 bg-bg p-3.5 text-body font-normal text-text-primary focus:border-accent focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/20"
        />
      </label>
      <p id={`${id}-count`} className="text-right text-caption text-text-secondary tabular-nums">
        {values.note.length}/500
      </p>
      <FirstPainEntryTime values={values} onChange={onChange} />
    </div>
  );
}
