import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { suggestDurationDays } from '../../application/suggestDurationDays';

type DurationSuggestionProps = { form: UseFormReturn<PrescriptionFormValues>; index: number };

const vi = (value: number) => value.toLocaleString('vi-VN');

// BR-025: gợi ý số ngày từ tổng số lượng in trên đơn — không tự điền, người duyệt bấm "Áp dụng".
export function DurationSuggestion({ form, index }: DurationSuggestionProps) {
  const item = useWatch({ control: form.control, name: `items.${index}` });
  const suggestion = suggestDurationDays(item);
  if (!suggestion) return null;
  const { days, total, perDose, slotCount } = suggestion;
  const apply = () =>
    form.setValue(`items.${index}.durationDays`, String(days), { shouldDirty: true, shouldValidate: true });
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#e4f0f0] px-4 py-3 text-sm text-[#20594b]">
      <p>
        Gợi ý theo tổng số lượng trên đơn: {vi(total)} ÷ ({vi(perDose)} × {slotCount} buổi) ={' '}
        <strong>{days} ngày</strong>
      </p>
      <button
        type="button"
        onClick={apply}
        className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
      >
        Áp dụng {days} ngày
      </button>
    </div>
  );
}
