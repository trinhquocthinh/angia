import { useState } from 'react';
import type { CurrentMedicationCourse } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { AsNeededDoseSheet, type DoseSheetMode } from './AsNeededDoseSheet';

type Props = { course: CurrentMedicationCourse; session: ProfileSession; readOnly?: boolean };
const buttonClass =
  'min-h-11 rounded-xl bg-accent-soft px-3 text-sm font-semibold text-accent hover:bg-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';
export function AsNeededDoseActions({ course, session, readOnly = false }: Props) {
  const [mode, setMode] = useState<DoseSheetMode | null>(null);
  if (
    !session.family ||
    !course.prescriptionItemId ||
    course.source !== 'prescription' ||
    course.slots.length !== 1 ||
    course.slots[0] !== 'as_needed'
  )
    return null;
  const editable = !readOnly && session.role === 'main';
  if (!editable && session.account.healthProfileId !== course.healthProfileId) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {editable && (
        <button type="button" className={buttonClass} onClick={() => setMode('record')}>
          Ghi liều
        </button>
      )}
      {editable && course.interval?.source !== 'prescription' && (
        <button type="button" className={buttonClass} onClick={() => setMode('interval')}>
          {course.interval ? 'Sửa khoảng cách' : 'Nhập khoảng cách'}
        </button>
      )}
      <button type="button" className={buttonClass} onClick={() => setMode('history')}>
        Xem nhật ký
      </button>
      {mode && (
        <AsNeededDoseSheet
          key={`${session.account.id}:${session.family.id}:${course.id}:${mode}`}
          course={course}
          session={session}
          readOnly={!editable}
          mode={mode}
          onClose={() => setMode(null)}
        />
      )}
    </div>
  );
}
