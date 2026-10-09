import type { UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { DocumentIcon } from './DocumentIcon';
import { PrescriptionDoseFields } from './PrescriptionDoseFields';
import { ReadingField } from './ReadingField';

type ItemCardProps = {
  form: UseFormReturn<PrescriptionFormValues>;
  index: number;
  onRemove: (() => void) | null;
};

// Một dòng thuốc của `useFieldArray`; viền đỏ khi dòng còn thiếu thông tin để dễ thấy vị trí lỗi.
export function PrescriptionItemCard({ form, index, onRemove }: ItemCardProps) {
  const errors = form.formState.errors.items?.[index];
  const invalid = Boolean(errors?.name ?? errors?.quantityPerDose ?? errors?.slots ?? errors?.durationDays);
  const order = index + 1;
  return (
    <li
      id={`rx-item-${index}`}
      aria-labelledby={`rx-item-${index}-title`}
      className={`flex scroll-mt-24 flex-col gap-4 rounded-2xl bg-[#f6fbfa] p-4 outline-2 lg:p-5 ${
        invalid ? 'outline-[#b42318]' : 'outline-transparent'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#004135] text-xs font-bold text-white"
        >
          {order}
        </span>
        <h3 id={`rx-item-${index}-title`} className="flex-1 text-sm font-semibold text-[#286958]">
          Thuốc {order}
        </h3>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Xóa dòng ${order}`}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#55615f] hover:bg-[#e4f0f0] hover:text-[#b42318] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
          >
            <DocumentIcon name="close" size={18} />
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ReadingField
          id={`items-${index}-name`}
          label="Tên thuốc *"
          autoComplete="off"
          error={errors?.name?.message}
          {...form.register(`items.${index}.name`)}
        />
        <ReadingField
          id={`items-${index}-strength`}
          label="Hàm lượng"
          autoComplete="off"
          compact
          {...form.register(`items.${index}.strength`)}
        />
      </div>
      <PrescriptionDoseFields form={form} index={index} />
      <ReadingField
        id={`items-${index}-note`}
        label="Cách dùng ghi trên đơn"
        autoComplete="off"
        compact
        {...form.register(`items.${index}.note`)}
      />
    </li>
  );
}
