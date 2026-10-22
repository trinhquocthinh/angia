import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { ReadingField } from './ReadingField';

type Props = { form: UseFormReturn<PrescriptionFormValues>; index: number; optional: boolean };

// Ô "Mỗi lần dùng": bắt buộc trừ thuốc dùng ngoài / "Khi cần" (BR-025); liều AI điền cần đối chiếu ảnh (E1).
export function DosePerIntakeField({ form, index, optional }: Props) {
  const fromAi = useWatch({ control: form.control, name: `items.${index}.fromAi` });
  const hint = optional
    ? 'Để trống nếu đơn không ghi số lượng mỗi lần.'
    : fromAi
      ? 'Tự động nhận diện — đối chiếu số lượng với ảnh.'
      : undefined;
  return (
    <ReadingField
      id={`items-${index}-quantityPerDose`}
      label={optional ? 'Mỗi lần dùng' : 'Mỗi lần dùng *'}
      inputMode="decimal"
      autoComplete="off"
      error={form.formState.errors.items?.[index]?.quantityPerDose?.message}
      hint={hint}
      {...form.register(`items.${index}.quantityPerDose`)}
    />
  );
}
