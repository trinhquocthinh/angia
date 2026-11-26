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
        <label
          key={source}
          className="flex min-h-btn cursor-pointer items-center gap-3 rounded-2xl border border-border/45 bg-bg px-4 py-2.5 transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
        >
          <input
            type="radio"
            name={`${id}-source`}
            value={source}
            checked={values.source === source}
            required
            onChange={() => onChange({ source })}
            className="h-5 w-5 accent-accent"
          />
          <span>{label}</span>
        </label>
      ))}
      {values.source === 'prescribed' && (
        <label className="block text-caption font-semibold text-text-secondary">
          Người chỉ định (tùy chọn)
          <input
            className="mt-1.5 min-h-12 w-full rounded-2xl border border-border/55 bg-bg px-3.5 text-body font-normal text-text-primary focus:border-accent focus:bg-surface focus:outline-none"
            value={values.prescriber}
            maxLength={100}
            onChange={(event) => onChange({ prescriber: event.target.value })}
          />
        </label>
      )}
    </fieldset>
  );
}
