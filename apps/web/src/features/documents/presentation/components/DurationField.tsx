import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { ReadingField } from './ReadingField';

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
      <label className="mt-7 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl bg-[#eaf6f5] px-4 text-sm font-medium text-[#3f4946] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#286958]">
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          {...form.register(`items.${index}.longTerm`, {
            onChange: () => void form.trigger(`items.${index}.durationDays`),
          })}
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-10 shrink-0 rounded-full bg-[#bfc9c4] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[#004135] peer-checked:after:translate-x-4"
        />
        Dài hạn
      </label>
    </div>
  );
}
