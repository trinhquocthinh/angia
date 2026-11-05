import { useId } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { DoseFormValues } from './AsNeededDoseForm';

const fields = [
  { name: 'givenAt', label: 'Ngày/giờ đã cho (giờ Việt Nam)', type: 'datetime-local' },
  { name: 'quantity', label: 'Số lượng (tùy chọn)', type: 'text' },
  { name: 'unit', label: 'Đơn vị (tùy chọn)', type: 'text' },
] as const;
export function AsNeededDoseFields({ form }: { form: UseFormReturn<DoseFormValues> }) {
  const prefix = useId();
  return (
    <>
      {fields.map(({ name, label, type }) => {
        const id = `${prefix}-${name}`;
        const error = form.formState.errors[name]?.message;
        return (
          <div key={name} className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-semibold">
              {label}
            </label>
            <input
              id={id}
              type={type}
              {...form.register(name)}
              required={name === 'givenAt'}
              inputMode={name === 'quantity' ? 'decimal' : undefined}
              maxLength={name === 'unit' ? 20 : undefined}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${id}-error` : undefined}
              className="min-h-12 w-full rounded-xl border border-[#d9e5e4] bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-[#286958]"
            />
            {error && (
              <p id={`${id}-error`} role="alert" className="text-sm text-[#b42318]">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}
