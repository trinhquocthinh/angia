import type { ExerciseNote } from '@angia/contracts';
import { RecordedBy } from '../PainIssueDetail/RecordedBy';
const date = (value: string) => value.split('-').reverse().join('/');
export function ExerciseNoteCard({
  exercise,
  onEdit,
}: {
  exercise: ExerciseNote;
  onEdit?: (() => void) | undefined;
}) {
  return (
    <li className="min-w-0 space-y-2 rounded-xl border border-border p-4 [overflow-wrap:anywhere]">
      <h3 className="font-semibold">{exercise.name}</h3>
      <p className="flex items-center gap-2">
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path
            d={
              exercise.source === 'self'
                ? 'm4 16 12-12 4 4L8 20H4v-4Z M14 6l4 4'
                : 'M5 3H4v6a5 5 0 0 0 10 0V3h-1 M9 14v2a5 5 0 0 0 10 0v-2 M19 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4'
            }
          />
        </svg>
        {exercise.source === 'self'
          ? 'Tự ghi'
          : `Bác sĩ chỉ định${exercise.prescriber ? ` · ${exercise.prescriber}` : ''}`}
      </p>
      <p>
        Từ {date(exercise.startDate)}
        {exercise.endDate ? ` đến ${date(exercise.endDate)}` : ''}
      </p>
      {exercise.note && <p className="whitespace-pre-wrap">{exercise.note}</p>}
      <RecordedBy createdBy={exercise.createdBy} updatedBy={exercise.updatedBy} />
      {onEdit && (
        <button
          type="button"
          className="min-h-11 px-3 underline"
          aria-label={`Sửa bài tập ${exercise.name}`}
          onClick={(event) => {
            event.currentTarget.focus();
            onEdit();
          }}
        >
          Sửa
        </button>
      )}
    </li>
  );
}
