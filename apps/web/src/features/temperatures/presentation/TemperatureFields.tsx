import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { TemperatureFormValues } from '../application/temperatureForm';

export function TemperatureFields({ form }: { form: UseFormReturn<TemperatureFormValues> }) {
  const id = useId();
  return (
    <>
      <label htmlFor={`${id}-celsius`} className="flex min-w-0 flex-col gap-2 text-caption font-medium">
        Nhiệt độ (°C)
        <input
          id={`${id}-celsius`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          {...form.register('celsius')}
          aria-invalid={Boolean(form.formState.errors.celsius)}
          aria-describedby={form.formState.errors.celsius ? `${id}-celsius-error` : undefined}
          className="min-h-12 rounded-2xl border border-border/55 bg-bg px-3.5 text-body text-text-primary focus:border-accent focus:bg-surface focus-visible:outline-2 focus-visible:outline-focus"
        />
      </label>
      {form.formState.errors.celsius && (
        <p id={`${id}-celsius-error`} role="alert" className="text-body text-danger">
          {form.formState.errors.celsius.message}
        </p>
      )}
      <label htmlFor={`${id}-measuredAt`} className="flex min-w-0 flex-col gap-2 text-caption font-medium">
        Ngày giờ đo (giờ Việt Nam)
        <input
          id={`${id}-measuredAt`}
          type="datetime-local"
          {...form.register('measuredAt')}
          aria-invalid={Boolean(form.formState.errors.measuredAt)}
          aria-describedby={form.formState.errors.measuredAt ? `${id}-time-error` : undefined}
          className="min-h-12 min-w-0 rounded-2xl border border-border/55 bg-bg px-3.5 text-body text-text-primary focus:border-accent focus:bg-surface focus-visible:outline-2 focus-visible:outline-focus"
        />
      </label>
      {form.formState.errors.measuredAt && (
        <p id={`${id}-time-error`} role="alert" className="text-body text-danger">
          {form.formState.errors.measuredAt.message}
        </p>
      )}
    </>
  );
}
