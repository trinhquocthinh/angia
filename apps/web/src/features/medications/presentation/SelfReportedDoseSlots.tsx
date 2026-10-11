import { Controller, type Control } from 'react-hook-form';
import { DOSE_SLOTS, sortDoseSlots } from '@src/features/documents/application/doseSlots';
import { ChoiceChip } from '@src/features/documents/presentation/components/ChoiceChip';
import type { SelfReportedCourseFormValues } from '../application/selfReportedCourseForm';
export function SelfReportedDoseSlots({
  control,
  error,
}: {
  control: Control<SelfReportedCourseFormValues>;
  error?: string | undefined;
}) {
  return (
    <Controller
      control={control}
      name="slots"
      render={({ field }) => (
        <fieldset
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? 'supplement-slots-error' : undefined}
        >
          <legend className="mb-2 text-sm font-medium">Buổi dùng *</legend>
          <div ref={field.ref} tabIndex={-1} className="flex flex-wrap gap-2 outline-none">
            {DOSE_SLOTS.map((slot) => {
              const selected = field.value.includes(slot.value);
              return (
                <ChoiceChip
                  key={slot.value}
                  selected={selected}
                  onClick={() =>
                    field.onChange(
                      sortDoseSlots(
                        selected ? field.value.filter((s) => s !== slot.value) : [...field.value, slot.value],
                      ),
                    )
                  }
                >
                  {slot.label}
                </ChoiceChip>
              );
            })}
          </div>
          {error && (
            <p id="supplement-slots-error" className="mt-1 text-sm text-[#b42318]">
              {error}
            </p>
          )}
        </fieldset>
      )}
    />
  );
}
