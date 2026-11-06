export type ExerciseNote = {
  readonly name: string;
  readonly source: 'prescribed' | 'self';
  readonly prescriber: string | null;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly note: string | null;
};

type ExerciseResult = { ok: true; value: ExerciseNote } | { ok: false; code: 'ERR_VALIDATION' };

// Application ghép PATCH và chuẩn hóa trường tùy chọn thành null; contracts kiểm độ dài.
export function prepareExerciseNote(value: ExerciseNote, kind: 'create' | 'update'): ExerciseResult {
  const { name, source, startDate, endDate } = value;
  const invalidDate = [startDate, endDate].some((day) => {
    if (day === null) return false;
    const date = new Date(`${day}T00:00:00Z`);
    return (
      !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== day
    );
  });
  if (
    name.length === 0 ||
    invalidDate ||
    (endDate !== null && endDate < startDate) ||
    (kind === 'create' && source === 'self' && value.prescriber !== null)
  ) {
    return { ok: false, code: 'ERR_VALIDATION' };
  }
  return {
    ok: true,
    value: { ...value, prescriber: source === 'self' ? null : value.prescriber },
  };
}
