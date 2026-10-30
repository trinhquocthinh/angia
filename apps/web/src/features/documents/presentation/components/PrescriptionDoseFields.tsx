import { useWatch, type UseFormReturn } from 'react-hook-form';
import { isDoseOptional, type PrescriptionFormValues } from '../../application/prescriptionForm';
import { DosePerIntakeField } from './DosePerIntakeField';
import { DoseSlotPicker } from './DoseSlotPicker';
import { DurationField } from './DurationField';
import { DurationSuggestion } from './DurationSuggestion';
import { ReadingField } from './ReadingField';
import { SwitchField } from './SwitchField';

type DoseFieldsProps = { form: UseFormReturn<PrescriptionFormValues>; index: number };

// Liều mỗi lần, buổi dùng, thời gian — bắt buộc trích từ đơn hoặc người duyệt nhập tay (BR-025).
// Thuốc bôi / dùng ngoài hoặc buổi "Khi cần": liều mỗi lần được để trống.
export function PrescriptionDoseFields({ form, index }: DoseFieldsProps) {
  const externalUse = useWatch({ control: form.control, name: `items.${index}.externalUse` });
  const slots = useWatch({ control: form.control, name: `items.${index}.slots` });
  const doseOptional = isDoseOptional({ externalUse, slots });
  const errors = form.formState.errors.items?.[index];
  // Đổi sang/khỏi "Khi cần" làm thay đổi yêu cầu liều: kiểm lại để lỗi cũ không đứng sai.
  const recheckDose = () => {
    if (errors?.quantityPerDose) void form.trigger(`items.${index}.quantityPerDose`);
  };
  // Container query thay breakpoint viewport: form nằm trong ngăn hẹp trên desktop. items-start để
  // dòng lỗi dưới một ô không kéo lệch nhãn/ô bên cạnh.
  return (
    <div className="@container flex flex-col gap-4">
      <SwitchField
        className="w-full flex-row-reverse justify-between"
        {...form.register(`items.${index}.externalUse`, {
          onChange: () => void form.trigger(`items.${index}.quantityPerDose`),
        })}
      >
        Thuốc bôi / dùng ngoài
      </SwitchField>
      <div className="grid grid-cols-2 items-start gap-3 @md:grid-cols-3">
        <DosePerIntakeField form={form} index={index} optional={doseOptional} />
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
      <DoseSlotPicker
        control={form.control}
        index={index}
        error={errors?.slots?.message}
        onChanged={recheckDose}
      />
      <DurationField form={form} index={index} />
      <DurationSuggestion form={form} index={index} />
    </div>
  );
}
