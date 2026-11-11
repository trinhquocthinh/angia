import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { TemperatureFormValues } from '../application/temperatureForm';

export function TemperatureFields({ form }: { form: UseFormReturn<TemperatureFormValues> }) {
  const id = useId();
  return (
    <>
      <label htmlFor={`${id}-celsius`} className="flex min-w-0 flex-col gap-2 text-sm font-medium">
        Nhiệt độ (°C)
        <input
          id={`${id}-celsius`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          {...form.register('celsius')}
          aria-invalid={Boolean(form.formState.errors.celsius)}
          aria-describedby={form.formState.errors.celsius ? `${id}-celsius-error` : undefined}
          className="min-h-11 rounded-xl border border-border px-3"
        />
      </label>
      {form.formState.errors.celsius && (
        <p id={`${id}-celsius-error`} role="alert" className="text-sm text-danger">
          {form.formState.errors.celsius.message}
        </p>
      )}
      <label htmlFor={`${id}-measuredAt`} className="flex min-w-0 flex-col gap-2 text-sm font-medium">
        Ngày giờ đo (giờ Việt Nam)
        <input
          id={`${id}-measuredAt`}
          type="datetime-local"
          {...form.register('measuredAt')}
          aria-invalid={Boolean(form.formState.errors.measuredAt)}
          aria-describedby={form.formState.errors.measuredAt ? `${id}-time-error` : undefined}
          className="min-h-11 min-w-0 rounded-xl border border-border px-3"
        />
      </label>
      {form.formState.errors.measuredAt && (
        <p id={`${id}-time-error`} role="alert" className="text-sm text-danger">
          {form.formState.errors.measuredAt.message}
        </p>
      )}
    </>
  );
}
