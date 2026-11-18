import type { UseFormReturn } from 'react-hook-form';
export function HouseholdNameSuggestions({ form }: { form: UseFormReturn<{ name: string }> }) {
  return (
    <div className="household-name-suggestions">
      <span>Gợi ý nhanh</span>
      <div>
        {['Nhà Nguyễn An', 'Tổ ấm Bác Ba', 'Gia đình Hạnh Phúc'].map((name) => (
          <button key={name} type="button" onClick={() => form.setValue('name', name, { shouldDirty: true })}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
