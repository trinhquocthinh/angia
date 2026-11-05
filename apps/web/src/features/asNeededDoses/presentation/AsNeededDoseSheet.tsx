import { useId } from 'react';
import type { CurrentMedicationCourse } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { SidePanel } from '@src/shared/ui/SidePanel';
import { useAsNeededDoseMutation } from '../application/useAsNeededDoseMutation';
import { createAsNeededDoseRepository } from '../infrastructure/createAsNeededDoseRepository';
import { AsNeededDoseForm } from './AsNeededDoseForm';
import { CourseIntervalForm } from './CourseIntervalForm';
import { AsNeededDoseHistory } from './AsNeededDoseHistory';

const repository = createAsNeededDoseRepository();
export type DoseSheetMode = 'record' | 'interval' | 'history';
type Props = {
  course: CurrentMedicationCourse;
  session: ProfileSession;
  readOnly: boolean;
  mode: DoseSheetMode;
  onClose: () => void;
};
export function AsNeededDoseSheet({ course, session, readOnly, mode, onClose }: Props) {
  const id = useId();
  const state = useAsNeededDoseMutation(session, course.healthProfileId);
  const editable = !readOnly && session.role === 'main' && Boolean(session.family);
  const save = (action: () => Promise<unknown>) => {
    void state.run(action).then((saved) => {
      if (saved) onClose();
    });
  };
  return (
    <SidePanel
      titleId={id}
      title={`${mode === 'record' ? 'Ghi liều' : mode === 'interval' ? 'Khoảng cách' : 'Nhật ký liều'} · ${course.name}`}
      subtitle="Chỉ ghi nhận thông tin đã nhập."
      closeLabel="Đóng thuốc Khi cần"
      pending={state.pending}
      onClose={onClose}
    >
      {mode === 'record' && editable && (
        <AsNeededDoseForm
          course={course}
          {...state}
          onCancel={onClose}
          onSubmit={(request) =>
            save(() => repository.record(course.healthProfileId, request, session.csrfToken))
          }
        />
      )}
      {mode === 'interval' && editable && course.interval?.source !== 'prescription' && (
        <CourseIntervalForm
          initialText={course.interval?.text ?? ''}
          {...state}
          onCancel={onClose}
          onSubmit={(text) =>
            save(() => repository.setInterval(course.healthProfileId, course.id, text, session.csrfToken))
          }
        />
      )}
      {mode === 'history' && (
        <AsNeededDoseHistory
          repository={repository}
          session={session}
          course={course}
          readOnly={!editable}
          {...state}
          remove={(doseId) =>
            state.run(() => repository.remove(course.healthProfileId, doseId, session.csrfToken))
          }
        />
      )}
    </SidePanel>
  );
}
