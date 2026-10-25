import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ReadingFormValues } from '../../application/readingForm';
import { GlucoseValueFields } from './GlucoseValueFields';
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
  if (kind === 'glucose') return <GlucoseValueFields register={register} errors={errors} flagged={flagged} />;
  // Container query: cột form ở màn duyệt hẹp hơn viewport nhiều, 3 cột chỉ khi khung đủ rộng.
  return (
    <div className="@container">
      <div className="grid gap-4 @md:grid-cols-3">
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
    </div>
  );
}
