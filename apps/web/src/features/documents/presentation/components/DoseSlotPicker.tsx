import { Fragment } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { AS_NEEDED, DOSE_SLOTS, toggleDoseSlot } from '../../application/doseSlots';
import type { PrescriptionFormValues } from '../../application/prescriptionForm';
import { ChoiceChip } from './ChoiceChip';

type DoseSlotPickerProps = {
  control: Control<PrescriptionFormValues>;
  index: number;
  error?: string | undefined;
  // Gọi sau khi đổi buổi — nơi dùng kiểm lại ô phụ thuộc (liều mỗi lần với "Khi cần").
  onChanged?: () => void;
};

// 4 chip buổi Sáng/Trưa/Chiều/Tối và chip "Khi cần" loại trừ; chỉ người duyệt bật/tắt, không tự suy (BR-025).
export function DoseSlotPicker({ control, index, error, onChanged }: DoseSlotPickerProps) {
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
            {[...DOSE_SLOTS, AS_NEEDED].map((slot) => (
              <Fragment key={slot.value}>
                {slot.value === AS_NEEDED.value && (
                  <span aria-hidden="true" className="mx-1 w-px self-stretch bg-[#bfc9c4]" />
                )}
                <ChoiceChip
                  selected={field.value.includes(slot.value)}
                  onClick={() => {
                    field.onChange(toggleDoseSlot(field.value, slot.value));
                    onChanged?.();
                  }}
                >
                  {slot.label}
                </ChoiceChip>
              </Fragment>
            ))}
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
