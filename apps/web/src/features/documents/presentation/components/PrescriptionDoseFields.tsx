import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { DoseSlotPicker } from './DoseSlotPicker';
import { DurationField } from './DurationField';
import { DurationSuggestion } from './DurationSuggestion';
import { ReadingField } from './ReadingField';
import { SwitchField } from './SwitchField';

type DoseFieldsProps = { form: UseFormReturn<PrescriptionFormValues>; index: number };

// Liều mỗi lần, buổi dùng, thời gian — bắt buộc trích từ đơn hoặc người duyệt nhập tay (BR-025).
// Thuốc bôi / dùng ngoài: người duyệt bật công tắc thì liều mỗi lần được để trống.
export function PrescriptionDoseFields({ form, index }: DoseFieldsProps) {
  const fromAi = useWatch({ control: form.control, name: `items.${index}.fromAi` });
  const externalUse = useWatch({ control: form.control, name: `items.${index}.externalUse` });
  const errors = form.formState.errors.items?.[index];
  // Container query thay breakpoint viewport: form nằm trong ngăn hẹp trên desktop. items-start để
  // dòng lỗi dưới một ô không kéo lệch nhãn/ô bên cạnh.
  return (
    <div className="@container flex flex-col gap-4">
      <SwitchField
        className="self-start"
        {...form.register(`items.${index}.externalUse`, {
          onChange: () => void form.trigger(`items.${index}.quantityPerDose`),
        })}
      >
        Thuốc bôi / dùng ngoài
      </SwitchField>
      <div className="grid grid-cols-2 items-start gap-3 @md:grid-cols-3">
        <ReadingField
          id={`items-${index}-quantityPerDose`}
          label={externalUse ? 'Mỗi lần dùng' : 'Mỗi lần dùng *'}
          inputMode="decimal"
          autoComplete="off"
          error={errors?.quantityPerDose?.message}
          hint={
            externalUse
              ? 'Để trống nếu đơn không ghi số lượng mỗi lần.'
              : fromAi
                ? 'AI đọc — đối chiếu số lượng với ảnh.'
                : undefined
          }
          {...form.register(`items.${index}.quantityPerDose`)}
        />
        <ReadingField
          id={`items-${index}-doseUnit`}
          label="Đơn vị"
          placeholder="viên, gói, ml…"
          compact
          {...form.register(`items.${index}.doseUnit`)}
        />
        <div className="col-span-2 @md:col-span-1">
          <ReadingField
            id={`items-${index}-totalQuantity`}
            label="Tổng số lượng trên đơn"
            inputMode="decimal"
            autoComplete="off"
            error={errors?.totalQuantity?.message}
            {...form.register(`items.${index}.totalQuantity`)}
          />
        </div>
      </div>
      <DoseSlotPicker control={form.control} index={index} error={errors?.slots?.message} />
      <DurationField form={form} index={index} />
      <DurationSuggestion form={form} index={index} />
    </div>
  );
}
