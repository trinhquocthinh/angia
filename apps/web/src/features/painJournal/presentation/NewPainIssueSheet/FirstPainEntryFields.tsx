import { FirstPainEntryTime } from './FirstPainEntryTime';
import { useId } from 'react';
import type { FirstEntryFieldsProps } from './newPainIssueTypes';
import { FirstPainEntryLevel } from './FirstPainEntryLevel';
export function FirstPainEntryFields({ values, onChange }: FirstEntryFieldsProps) {
  const id = useId();
  return (
    <div className="space-y-4">
      <FirstPainEntryLevel values={values} onChange={onChange} />
      <label className="flex flex-col gap-2 text-sm" htmlFor={`${id}-note`}>
        Ghi chú (tùy chọn)
        <textarea
          id={`${id}-note`}
          rows={3}
          maxLength={500}
          value={values.note}
          onChange={(event) => onChange({ note: event.target.value })}
          aria-describedby={`${id}-count`}
          className="rounded-xl border border-border p-3"
        />
      </label>
      <p id={`${id}-count`} className="text-sm text-text-secondary">
        {values.note.length}/500
      </p>
      <FirstPainEntryTime values={values} onChange={onChange} />
    </div>
  );
}
