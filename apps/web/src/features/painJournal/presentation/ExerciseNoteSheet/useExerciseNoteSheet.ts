import { initialExerciseNoteValues } from '../../application/initialExerciseNoteValues';
import { changeExerciseNoteValues } from '../../application/changeExerciseNoteValues';
import { useState } from 'react';
import type { ExerciseNote } from '@angia/contracts';
import { ZodError } from 'zod';
import { exerciseNoteForm, type ExerciseNoteValues } from '../../application/exerciseNoteForm';
import { useSaveExerciseNote } from '../../application/useSaveExerciseNote';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { ExerciseNoteWriter } from '../../application/ports';
export type ExerciseNoteSheetProps = {
  api: ExerciseNoteWriter;
  session: ProfileSession;
  profile: HealthProfile;
  scope: 'main' | 'self';
  issueId: string;
  exercise?: ExerciseNote | undefined;
  onClose: () => void;
  onSaved: (message: string) => void;
};
export function useExerciseNoteSheet(props: ExerciseNoteSheetProps) {
  const [values, setValues] = useState(() => initialExerciseNoteValues(props.exercise));
  const [validation, setValidation] = useState<string | null>(null);
  const writer = useSaveExerciseNote(props.api, props.session, props.profile, props.scope, props.issueId);
  const change = (patch: Partial<ExerciseNoteValues>) => {
    setValues((v) => changeExerciseNoteValues(v, patch));
    setValidation(null);
  };
  const save = async () => {
    let body;
    try {
      body = exerciseNoteForm(values, Boolean(props.exercise));
    } catch (cause) {
      setValidation(
        cause instanceof ZodError
          ? 'Kiểm tra tên, nguồn, ngày hợp lệ và độ dài các trường; ngày kết thúc phải từ ngày bắt đầu trở đi.'
          : cause instanceof Error
            ? cause.message
            : 'Vui lòng kiểm tra thông tin bài tập.',
      );
      return;
    }
    if (await writer.save(body, props.exercise?.id))
      props.onSaved(props.exercise ? 'Đã sửa bài tập.' : 'Đã thêm bài tập.');
  };
  return { ...writer, values, change, save, error: validation ?? writer.error };
}
