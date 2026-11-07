import { useId, useState } from 'react';
import type { ExerciseNote, PainIssueDetail } from '@angia/contracts';
import type { ExerciseNoteSheetProps } from '../ExerciseNoteSheet/useExerciseNoteSheet';
import { ExerciseNoteSheet } from '../ExerciseNoteSheet/ExerciseNoteSheet';
import { ExerciseNoteCard } from './ExerciseNoteCard';
type Props = Omit<ExerciseNoteSheetProps, 'exercise' | 'onClose'> & {
  issue: PainIssueDetail;
  allowed: boolean;
};
export function ExerciseNotes(props: Props) {
  const id = useId();
  const [editing, setEditing] = useState<ExerciseNote | 'new' | null>(null);
  return (
    <section aria-labelledby={id} className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold">
          Bài tập
        </h2>
        {props.allowed && (
          <button
            type="button"
            className="min-h-11 px-3 underline"
            onClick={(event) => {
              event.currentTarget.focus();
              setEditing('new');
            }}
          >
            Thêm bài tập
          </button>
        )}
      </div>
      {props.issue.exercises.length === 0 ? (
        <p>Chưa ghi bài tập nào.</p>
      ) : (
        <ul className="space-y-3">
          {props.issue.exercises.map((exercise) => (
            <ExerciseNoteCard
              key={exercise.id}
              exercise={exercise}
              onEdit={props.allowed ? () => setEditing(exercise) : undefined}
            />
          ))}
        </ul>
      )}
      {editing && props.allowed && (
        <ExerciseNoteSheet
          {...props}
          key={editing === 'new' ? 'new' : editing.id}
          exercise={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            props.onSaved(message);
          }}
        />
      )}
    </section>
  );
}
