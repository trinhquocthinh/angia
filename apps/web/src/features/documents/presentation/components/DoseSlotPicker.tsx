import { Controller, type Control } from 'react-hook-form';
import { DOSE_SLOTS, sortDoseSlots } from '../../application/doseSlots';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { ChoiceChip } from './ChoiceChip';

type DoseSlotPickerProps = {
  control: Control<PrescriptionFormValues>;
  index: number;
  error?: string | undefined;
};

// 4 chip buổi Sáng/Trưa/Chiều/Tối; chỉ người duyệt bật/tắt, không tự suy từ "ngày N lần" (BR-025).
export function DoseSlotPicker({ control, index, error }: DoseSlotPickerProps) {
  const errorId = `items-${index}-slots-error`;
  return (
    <Controller
      control={control}
      name={`items.${index}.slots`}
      render={({ field }) => (
        <fieldset
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? errorId : undefined}
          className="flex flex-col gap-2"
        >
          <legend className="mb-2 text-sm font-medium text-[#3f4946]">Buổi dùng *</legend>
          <div ref={field.ref} tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
            {DOSE_SLOTS.map((slot) => {
              const selected = field.value.includes(slot.value);
              const toggle = () =>
                field.onChange(
                  sortDoseSlots(
                    selected
                      ? field.value.filter((value) => value !== slot.value)
                      : [...field.value, slot.value],
                  ),
                );
              return (
                <ChoiceChip key={slot.value} selected={selected} onClick={toggle}>
                  {slot.label}
                </ChoiceChip>
              );
            })}
          </div>
          {error && (
            <p id={errorId} className="text-sm text-[#b42318]">
              {error}
            </p>
          )}
        </fieldset>
      )}
    />
  );
}
