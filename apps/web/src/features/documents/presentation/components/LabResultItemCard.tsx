import type { UseFormReturn } from 'react-hook-form';
import type { LabResultFormValues } from '../../application/labResultForm';
import { ItemCard } from './ItemCard';
import { ReadingField } from './ReadingField';

type ItemCardProps = {
  form: UseFormReturn<LabResultFormValues>;
  index: number;
  onRemove: (() => void) | null;
};

// Một chỉ số của `useFieldArray`; chép nguyên văn từ phiếu (BR-022), viền đỏ khi dòng còn thiếu thông tin.
// Không so kết quả với khoảng tham chiếu, không tô màu cao/thấp (BR-033).
export function LabResultItemCard({ form, index, onRemove }: ItemCardProps) {
  const errors = form.formState.errors.items?.[index];
  const invalid = Object.keys(errors ?? {}).length > 0;
  return (
    <ItemCard
      anchorPrefix="lab-item"
      index={index}
      title={`Chỉ số ${index + 1}`}
      invalid={invalid}
      onRemove={onRemove}
    >
      <ReadingField
        id={`items-${index}-testName`}
        label="Tên chỉ số *"
        autoComplete="off"
        compact
        error={errors?.testName?.message}
        {...form.register(`items.${index}.testName`)}
      />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ReadingField
          id={`items-${index}-value`}
          label="Kết quả *"
          autoComplete="off"
          error={errors?.value?.message}
          {...form.register(`items.${index}.value`)}
        />
        <ReadingField
          id={`items-${index}-unit`}
          label="Đơn vị"
          autoComplete="off"
          compact
          {...form.register(`items.${index}.unit`)}
        />
      </div>
      <ReadingField
        id={`items-${index}-referenceRange`}
        label="Khoảng tham chiếu in trên phiếu"
        autoComplete="off"
        compact
        hint="Phiếu không in thì để trống."
        {...form.register(`items.${index}.referenceRange`)}
      />
    </ItemCard>
  );
}
