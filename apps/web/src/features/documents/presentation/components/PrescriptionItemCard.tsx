import type { UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { PrescriptionDoseFields } from './PrescriptionDoseFields';
import { ItemCard } from './ItemCard';
import { ReadingField } from './ReadingField';

type ItemCardProps = {
  form: UseFormReturn<PrescriptionFormValues>;
  index: number;
  onRemove: (() => void) | null;
};

// Một dòng thuốc của `useFieldArray`; viền đỏ khi dòng còn thiếu thông tin để dễ thấy vị trí lỗi.
export function PrescriptionItemCard({ form, index, onRemove }: ItemCardProps) {
  const errors = form.formState.errors.items?.[index];
  const invalid = Object.keys(errors ?? {}).length > 0;
  return (
    <ItemCard
      anchorPrefix="rx-item"
      index={index}
      title={`Thuốc ${index + 1}`}
      invalid={invalid}
      onRemove={onRemove}
    >
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
    </ItemCard>
  );
}
