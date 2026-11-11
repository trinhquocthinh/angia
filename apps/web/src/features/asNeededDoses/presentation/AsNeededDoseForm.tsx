import { useForm } from 'react-hook-form';
import type { CurrentMedicationCourse, RecordAsNeededDoseRequest } from '@angia/contracts';
import { SidePanelFooter } from '@src/shared/ui/SidePanelFooter';
import { asNeededDoseFormSchema } from '../application/asNeededDoseForm';
import { AsNeededDoseFields } from './AsNeededDoseFields';

export type DoseFormValues = { givenAt: string; quantity: string; unit: string };
type Props = {
  course: CurrentMedicationCourse;
  pending: boolean;
  error: string | null;
  onSubmit: (request: RecordAsNeededDoseRequest) => void;
  onCancel: () => void;
};
export function AsNeededDoseForm({ course, pending, error, onSubmit, onCancel }: Props) {
  const form = useForm<DoseFormValues>({ defaultValues: { givenAt: '', quantity: '', unit: '' } });
  const submit = form.handleSubmit((values) => {
    if (pending) return;
    const parsed = asNeededDoseFormSchema(course).safeParse(values);
    if (parsed.success) onSubmit(parsed.data);
    else
      for (const issue of parsed.error.issues) {
        form.setError(
          issue.path[0] as keyof DoseFormValues,
          { message: issue.message },
          { shouldFocus: true },
        );
      }
  });
  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-1 flex-col">
      <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4 border-0 px-6 py-5">
        <p className="font-semibold">
          {course.name}
          {course.strength ? ` · ${course.strength}` : ''}
        </p>
        <AsNeededDoseFields form={form} />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </fieldset>
      <SidePanelFooter
        submitLabel={pending ? 'Đang lưu…' : 'Lưu liều'}
        cancelLabel="Hủy bỏ"
        disabled={pending}
        submit
        cancelDisabled={pending}
        onCancel={onCancel}
      />
    </form>
  );
}
