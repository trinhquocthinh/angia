import type { ExerciseNoteValues } from '../../application/exerciseNoteForm';
export function ExerciseNoteSource({
  id,
  values,
  onChange,
}: {
  id: string;
  values: ExerciseNoteValues;
  onChange: (patch: Partial<ExerciseNoteValues>) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend>Nguồn *</legend>
      {(
        [
          ['prescribed', 'Bác sĩ, chuyên viên chỉ định'],
          ['self', 'Tự ghi'],
        ] as const
      ).map(([source, label]) => (
        <label key={source} className="flex min-h-11 items-center gap-3 rounded-lg border border-border p-3">
          <input
            type="radio"
            name={`${id}-source`}
            value={source}
            checked={values.source === source}
            required
            onChange={() => onChange({ source })}
          />
          {label}
        </label>
      ))}
      {values.source === 'prescribed' && (
        <label className="block">
          Người chỉ định (tùy chọn)
          <input
            className="mt-1 min-h-11 w-full rounded-lg border border-border px-3"
            value={values.prescriber}
            maxLength={100}
            onChange={(event) => onChange({ prescriber: event.target.value })}
          />
        </label>
      )}
    </fieldset>
  );
}
