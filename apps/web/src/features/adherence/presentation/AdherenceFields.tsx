import type { UseFormReturn } from 'react-hook-form';
import type { AdherenceFormValues } from '../application/adherenceForm';
import { STATUS_LABEL } from '../application/periodText';

const INPUT =
  'h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-base text-text-primary placeholder:text-text-secondary focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-focus/20 aria-invalid:border-danger';
const LABEL = 'mb-2 block text-xs font-bold tracking-wider text-text-secondary uppercase';

type Props = { form: UseFormReturn<AdherenceFormValues>; today: string; suggestions: string[] };

const FieldError = ({ id, message }: { id: string; message: string | undefined }) =>
  message ? (
    <p id={id} className="mt-1 text-sm text-danger">
      {message}
    </p>
  ) : null;

export function AdherenceFields({ form, today, suggestions }: Props) {
  const { errors } = form.formState;
  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="adherence-name" className={LABEL}>
          Tên thuốc *
        </label>
        <input
          id="adherence-name"
          list="adherence-name-suggestions"
          autoComplete="off"
          placeholder="Ví dụ: Amlodipin"
          {...form.register('medicationName')}
          aria-invalid={Boolean(errors.medicationName) || undefined}
          aria-describedby={errors.medicationName ? 'adherence-name-error' : undefined}
          className={INPUT}
        />
        <datalist id="adherence-name-suggestions">
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <FieldError id="adherence-name-error" message={errors.medicationName?.message} />
      </div>
      <fieldset className="m-0 border-0 p-0">
        <legend className={LABEL}>Trạng thái *</legend>
        <div className="grid grid-cols-2 gap-2">
          {(['taking', 'stopped'] as const).map((status) => (
            <label
              key={status}
              className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-border px-3.5 text-sm font-medium has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent"
            >
              <input type="radio" value={status} {...form.register('status')} className="accent-accent" />
              {STATUS_LABEL[status]}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="adherence-from" className={LABEL}>
          Từ ngày *
        </label>
        <input
          id="adherence-from"
          type="date"
          max={today}
          {...form.register('fromDate')}
          aria-invalid={Boolean(errors.fromDate) || undefined}
          aria-describedby={errors.fromDate ? 'adherence-from-error' : undefined}
          className={INPUT}
        />
        <FieldError id="adherence-from-error" message={errors.fromDate?.message} />
      </div>
    </div>
  );
}
