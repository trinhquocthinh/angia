import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ReadingFormValues } from '../../application/readingForm';
import { ReadingField } from './ReadingField';

type ReadingValueFieldsProps = {
  kind: ReadingFormValues['kind'];
  register: UseFormRegister<ReadingFormValues>;
  errors: FieldErrors<ReadingFormValues>;
  flagged: string[];
};

const numeric = { inputMode: 'numeric', autoComplete: 'off' } as const;

// BR-019: tâm thu + tâm trương bắt buộc, mạch tùy chọn. BR-020: đường huyết kèm đơn vị gốc, không quy đổi.
export function ReadingValueFields({ kind, register, errors, flagged }: ReadingValueFieldsProps) {
  if (kind === 'glucose') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <ReadingField
          id="glucoseValue"
          label="Đường huyết"
          inputMode="decimal"
          autoComplete="off"
          error={errors.glucoseValue?.message}
          flagged={flagged.includes('glucoseValue')}
          {...register('glucoseValue')}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="glucoseUnit" className="text-sm font-medium text-[#3f4946]">
            Đơn vị trên máy
          </label>
          <select
            id="glucoseUnit"
            aria-invalid={Boolean(errors.glucoseUnit) || undefined}
            aria-describedby={errors.glucoseUnit ? 'glucoseUnit-error' : undefined}
            className="min-h-12 rounded-xl bg-[#eaf6f5] px-4 text-base text-[#131d1d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] aria-invalid:outline-2 aria-invalid:outline-[#b42318]"
            {...register('glucoseUnit')}
          >
            <option value="">Chọn đơn vị</option>
            <option value="mmol/L">mmol/L</option>
            <option value="mg/dL">mg/dL</option>
          </select>
          {errors.glucoseUnit && (
            <p id="glucoseUnit-error" className="text-sm text-[#b42318]">
              {errors.glucoseUnit.message}
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {(
        [
          ['systolic', 'Tâm thu', 'mmHg'],
          ['diastolic', 'Tâm trương', 'mmHg'],
          ['pulse', 'Mạch (không bắt buộc)', 'lần/phút'],
        ] as const
      ).map(([field, label, unit]) => (
        <ReadingField
          key={field}
          id={field}
          label={label}
          unit={unit}
          error={errors[field]?.message}
          flagged={flagged.includes(field)}
          {...numeric}
          {...register(field)}
        />
      ))}
    </div>
  );
}
