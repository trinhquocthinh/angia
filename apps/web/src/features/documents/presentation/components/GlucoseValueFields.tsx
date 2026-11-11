import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ReadingFormValues } from '../../application/readingForm';
import { ReadingField } from './ReadingField';

type Props = {
  register: UseFormRegister<ReadingFormValues>;
  errors: FieldErrors<ReadingFormValues>;
  flagged: string[];
};

// BR-020: đường huyết kèm đơn vị gốc trên máy, không quy đổi khi lưu.
export function GlucoseValueFields({ register, errors, flagged }: Props) {
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
        <label htmlFor="glucoseUnit" className="text-sm font-medium text-text-secondary">
          Đơn vị trên máy
        </label>
        <select
          id="glucoseUnit"
          aria-invalid={Boolean(errors.glucoseUnit) || undefined}
          aria-describedby={errors.glucoseUnit ? 'glucoseUnit-error' : undefined}
          className="min-h-12 rounded-xl bg-accent-soft px-4 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus aria-invalid:outline-2 aria-invalid:outline-danger"
          {...register('glucoseUnit')}
        >
          <option value="">Chọn đơn vị</option>
          <option value="mmol/L">mmol/L</option>
          <option value="mg/dL">mg/dL</option>
        </select>
        {errors.glucoseUnit && (
          <p id="glucoseUnit-error" className="text-sm text-danger">
            {errors.glucoseUnit.message}
          </p>
        )}
      </div>
    </div>
  );
}
