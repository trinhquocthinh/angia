import { useState } from 'react';
import type { AsNeededDose, CurrentMedicationCourse } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { asNeededDoseQuerySchema } from '@angia/contracts';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import type { AsNeededDoseRepository } from '../application/ports';
import { useAsNeededDoses } from '../application/useAsNeededDoses';
import { AsNeededDoseList } from './AsNeededDoseList';
import { AsNeededDoseDeleteConfirmation } from './AsNeededDoseDeleteConfirmation';
import { DoseHistoryRange } from './DoseHistoryRange';
import { DoseHistoryLoadState } from './DoseHistoryLoadState';

type Props = {
  repository: AsNeededDoseRepository;
  session: ProfileSession;
  course: CurrentMedicationCourse;
  readOnly: boolean;
  pending: boolean;
  error: string | null;
  remove: (doseId: string) => Promise<boolean>;
};
export function AsNeededDoseHistory(props: Props) {
  const { repository, session, course, readOnly, pending, error, remove } = props;
  const today = vietnamDate();
  const [range, setRange] = useState({ from: today, to: today });
  const [selected, setSelected] = useState<AsNeededDose | null>(null);
  const query = useAsNeededDoses(
    repository,
    session,
    course.healthProfileId,
    { ...range, courseId: course.id },
    readOnly,
  );
  return (
    <div className="flex flex-col gap-4 px-6 py-5">
      <DoseHistoryRange
        initial={range}
        pending={pending}
        onChange={(next) => {
          if (asNeededDoseQuerySchema.safeParse({ ...next, courseId: course.id }).success) {
            setRange(next);
            setSelected(null);
          }
        }}
      />
      <DoseHistoryLoadState
        loading={query.isFetching || query.isPending}
        error={query.isError}
        retry={() => void query.refetch()}
      />
      {query.data && (
        <AsNeededDoseList
          doses={query.data.doses}
          pending={pending}
          {...(!readOnly ? { onRemove: setSelected } : {})}
        />
      )}
      {selected && query.data?.doses.some((dose) => dose.id === selected.id) && !readOnly && (
        <AsNeededDoseDeleteConfirmation
          dose={selected}
          pending={pending}
          onCancel={() => setSelected(null)}
          onConfirm={() => {
            void remove(selected.id).then((saved) => {
              if (saved) setSelected(null);
            });
          }}
        />
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
