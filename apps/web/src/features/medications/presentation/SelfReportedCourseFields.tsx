import type { UseFormReturn } from 'react-hook-form';
import type { SelfReportedCourseFormValues } from '../application/selfReportedCourseForm';
const fields = [
  { name: 'name', label: 'Tên thuốc *', placeholder: 'Ví dụ: Canxi', type: 'text' },
  { name: 'strength', label: 'Hàm lượng', placeholder: 'Ví dụ: 500mg', type: 'text' },
  { name: 'quantityPerDose', label: 'Số lượng mỗi lần *', placeholder: 'Ví dụ: 1 hoặc 0,5', type: 'text' },
  { name: 'doseUnit', label: 'Đơn vị dùng *', placeholder: 'Ví dụ: viên hoặc ml', type: 'text' },
  { name: 'startDate', label: 'Ngày bắt đầu *', placeholder: '', type: 'date' },
] as const;
export function SelfReportedCourseFields({ form }: { form: UseFormReturn<SelfReportedCourseFormValues> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map(({ name, label, placeholder, type }) => {
        const message = form.formState.errors[name]?.message;
        return (
          <div key={name} className={name === 'name' ? 'sm:col-span-2' : ''}>
            <label
              htmlFor={`supplement-${name}`}
              className="mb-2 block text-xs font-bold tracking-wider text-[#55615f] uppercase"
            >
              {label}
            </label>
            <input
              id={`supplement-${name}`}
              {...form.register(name)}
              type={type}
              placeholder={placeholder}
              inputMode={name === 'quantityPerDose' ? 'decimal' : undefined}
              aria-invalid={Boolean(message) || undefined}
              aria-describedby={message ? `supplement-${name}-error` : undefined}
              className="h-12 w-full rounded-xl border border-[#d9e5e4] bg-white px-3.5 text-base text-[#131d1d] placeholder:text-[#8a9592] focus:border-[#004135] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004135]/20 aria-invalid:border-[#b42318]"
            />
            {message && (
              <p id={`supplement-${name}-error`} className="mt-1 text-sm text-[#b42318]">
                {message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
