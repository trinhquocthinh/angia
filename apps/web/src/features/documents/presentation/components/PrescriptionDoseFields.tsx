import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { DoseSlotPicker } from './DoseSlotPicker';
import { DurationField } from './DurationField';
import { ReadingField } from './ReadingField';

type DoseFieldsProps = { form: UseFormReturn<PrescriptionFormValues>; index: number };

// Liều mỗi lần, buổi dùng, thời gian — bắt buộc trích từ đơn hoặc người duyệt nhập tay (BR-025).
export function PrescriptionDoseFields({ form, index }: DoseFieldsProps) {
  const fromAi = useWatch({ control: form.control, name: `items.${index}.fromAi` });
  const errors = form.formState.errors.items?.[index];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <ReadingField
          id={`items-${index}-quantityPerDose`}
          label="Mỗi lần dùng *"
          inputMode="decimal"
          autoComplete="off"
          error={errors?.quantityPerDose?.message}
          hint={fromAi ? 'AI đọc — đối chiếu số lượng với ảnh.' : undefined}
          {...form.register(`items.${index}.quantityPerDose`)}
        />
        <ReadingField
          id={`items-${index}-doseUnit`}
          label="Đơn vị"
          placeholder="viên, gói, ml…"
          compact
          {...form.register(`items.${index}.doseUnit`)}
        />
      </div>
      <DoseSlotPicker control={form.control} index={index} error={errors?.slots?.message} />
      <DurationField form={form} index={index} />
    </div>
  );
}
