import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { ReadingField } from './ReadingField';
import { SwitchField } from './SwitchField';

type DurationFieldProps = { form: UseFormReturn<PrescriptionFormValues>; index: number };

// Số ngày HOẶC "Dài hạn" (SPEC-014): bật dài hạn thì khóa ô số ngày, ngày kết thúc để trống (BR-026).
export function DurationField({ form, index }: DurationFieldProps) {
  const longTerm = useWatch({ control: form.control, name: `items.${index}.longTerm` });
  const error = form.formState.errors.items?.[index]?.durationDays?.message;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <ReadingField
        id={`items-${index}-durationDays`}
        label="Số ngày dùng"
        unit="ngày"
        inputMode="numeric"
        autoComplete="off"
        // readOnly thay cho disabled: RHF bỏ giá trị ô disabled khiến schema chuỗi báo lỗi.
        readOnly={longTerm}
        aria-disabled={longTerm || undefined}
        error={longTerm ? undefined : error}
        {...form.register(`items.${index}.durationDays`)}
      />
      <SwitchField
        className="mt-7"
        {...form.register(`items.${index}.longTerm`, {
          onChange: () => void form.trigger(`items.${index}.durationDays`),
        })}
      >
        Dài hạn
      </SwitchField>
    </div>
  );
}
