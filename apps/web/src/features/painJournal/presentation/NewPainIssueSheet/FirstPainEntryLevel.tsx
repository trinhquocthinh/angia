import { useId } from 'react';
import type { FirstEntryFieldsProps } from './newPainIssueTypes';
export function FirstPainEntryLevel({ values, onChange }: FirstEntryFieldsProps) {
  const name = useId();
  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">Mức đau lúc này</legend>
      <p className="text-sm text-text-secondary">Chấm theo cảm nhận của bạn, từ 1 đến 10.</p>
      <div className="grid grid-cols-5 gap-2 min-[480px]:grid-cols-10">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
          <label
            key={level}
            className={`relative flex min-h-11 min-w-0 cursor-pointer items-center justify-center rounded-lg border text-lg tabular-nums has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${values.level === level ? 'border-accent bg-accent text-white' : 'border-border bg-surface'}`}
          >
            <input
              type="radio"
              className="absolute inset-0 cursor-pointer opacity-0"
              name={name}
              value={level}
              checked={values.level === level}
              onChange={() => onChange({ level })}
              aria-label={String(level)}
            />
            <span aria-hidden="true">{level}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
