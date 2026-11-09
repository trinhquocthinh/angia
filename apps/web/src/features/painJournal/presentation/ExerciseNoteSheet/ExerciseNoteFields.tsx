import { useId } from 'react';
import type { ExerciseNoteValues } from '../../application/exerciseNoteForm';
import { ExerciseNoteSource } from './ExerciseNoteSource';
export function ExerciseNoteFields({
  values,
  onChange,
}: {
  values: ExerciseNoteValues;
  onChange: (patch: Partial<ExerciseNoteValues>) => void;
}) {
  const id = useId();
  const inputClass = 'mt-1 min-h-11 w-full min-w-0 rounded-lg border border-border px-3';
  return (
    <div className="min-w-0 space-y-4">
      <label className="block">
        Tên bài tập *
        <input
          className={inputClass}
          required
          maxLength={100}
          value={values.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>
      <ExerciseNoteSource id={id} values={values} onChange={onChange} />
      <label className="block">
        Ngày bắt đầu *
        <input
          type="date"
          className={inputClass}
          required
          value={values.startDate}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </label>
      <label className="block">
        Ngày kết thúc (tùy chọn)
        <input
          type="date"
          className={inputClass}
          min={values.startDate || undefined}
          value={values.endDate}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </label>
      <label className="block">
        Ghi chú (số lần, số hiệp, tần suất…)
        <textarea
          className={`${inputClass} py-2`}
          rows={3}
          maxLength={1000}
          value={values.note}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </label>
    </div>
  );
}
