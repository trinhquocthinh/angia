import type { ExerciseNote } from '@angia/contracts';
import { RecordedBy } from '../PainIssueDetail/RecordedBy';
const date = (value: string) => value.split('-').reverse().join('/');
const SELF_PATH = 'm4 16 12-12 4 4L8 20H4v-4Z M14 6l4 4';
const DOCTOR_PATH =
  'M5 3H4v6a5 5 0 0 0 10 0V3h-1 M9 14v2a5 5 0 0 0 10 0v-2 M19 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4';

const sourceText = (exercise: ExerciseNote) =>
  exercise.source === 'self'
    ? 'Tự ghi'
    : `Bác sĩ chỉ định${exercise.prescriber ? ` · ${exercise.prescriber}` : ''}`;

export function ExerciseNoteCard({
  exercise,
  onEdit,
}: {
  exercise: ExerciseNote;
  onEdit?: (() => void) | undefined;
}) {
  return (
    <li className="min-w-0 space-y-2 rounded-2xl border border-border/35 bg-bg p-4 [overflow-wrap:anywhere]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-body font-semibold text-text-primary">{exercise.name}</h3>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border/35 bg-surface px-2.5 py-0.5 text-caption font-medium text-text-secondary">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d={exercise.source === 'self' ? SELF_PATH : DOCTOR_PATH} />
          </svg>
          {sourceText(exercise)}
        </p>
      </div>
      <p className="text-caption text-text-secondary tabular-nums">
        Từ {date(exercise.startDate)}
        {exercise.endDate ? ` đến ${date(exercise.endDate)}` : ''}
      </p>
      {exercise.note && <p className="whitespace-pre-wrap text-body text-text-primary">{exercise.note}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <RecordedBy createdBy={exercise.createdBy} updatedBy={exercise.updatedBy} />
        {onEdit && (
          <button
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-border/45 bg-surface px-3.5 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft"
            aria-label={`Sửa bài tập ${exercise.name}`}
            onClick={(event) => {
              event.currentTarget.focus();
              onEdit();
            }}
          >
            Sửa
          </button>
        )}
      </div>
    </li>
  );
}
