import type { UseFormRegisterReturn } from 'react-hook-form';

const KINDS = [
  { value: 'blood_pressure', label: 'Huyết áp & Mạch' },
  { value: 'glucose', label: 'Đường huyết' },
] as const;

// Loại chỉ số do AI đoán; người duyệt đổi được nếu máy đo là loại khác.
export function ReadingKindPicker({ register }: { register: UseFormRegisterReturn<'kind'> }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium text-text-secondary">Loại chỉ số</legend>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((kind) => (
          <label
            key={kind.value}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-accent-soft px-4 text-sm font-medium text-text-secondary has-checked:bg-accent has-checked:text-on-accent has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
          >
            <input type="radio" value={kind.value} className="sr-only" {...register} />
            {kind.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
