import { useId } from 'react';
import type { KeyboardEvent } from 'react';
import './painLevelPicker.css';
import { PainLevelGuidance } from './PainLevelGuidance';
type Props = { value: number | null; onChange: (level: number) => void; disabled?: boolean };
export function PainLevelPicker({ value, onChange, disabled = false }: Props) {
  const id = useId();
  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    const current = Number((event.target as HTMLInputElement).value);
    let next: number;
    if (/^[0-9]$/.test(event.key)) next = event.key === '0' ? 10 : Number(event.key);
    else if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (current % 10) + 1;
    else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = ((current + 8) % 10) + 1;
    else return;
    event.preventDefault();
    onChange(next);
    event.currentTarget.querySelector<HTMLInputElement>(`input[value="${next}"]`)?.focus();
  };
  return (
    <fieldset disabled={disabled} className="pain-level-picker space-y-2">
      <legend className="font-medium">Mức đau lúc này</legend>
      <PainLevelGuidance id={`${id}-hint`} />
      <div
        className="pain-level-grid"
        role="radiogroup"
        aria-label="Mức đau lúc này"
        aria-describedby={`${id}-hint`}
        onKeyDown={handleKey}
      >
        {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
          <label
            key={level}
            className={`pain-level-option ${value === level ? 'bg-accent text-white border-accent' : 'bg-surface border-border'}`}
          >
            <input
              type="radio"
              name={id}
              value={level}
              checked={value === level}
              tabIndex={value === level || (value === null && level === 1) ? 0 : -1}
              onChange={() => onChange(level)}
              aria-label={String(level)}
            />
            <span aria-hidden="true">{level}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
