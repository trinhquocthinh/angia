import { useContext, useId } from 'react';
import { ThemeContext } from './ThemeContext';

const options = [
  ['light', 'Sáng'],
  ['dark', 'Tối'],
  ['system', 'Theo máy'],
] as const;

export function ThemeSwitch() {
  const context = useContext(ThemeContext);
  const name = useId();
  if (!context) throw new Error('ThemeSwitch cần nằm trong ThemeProvider');

  return (
    <fieldset className="min-w-0 border-0 p-0 text-text-primary">
      <legend className="mb-2 text-base font-medium">Nền giao diện</legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1">
        {options.map(([value, label]) => (
          <label key={value} className="relative flex min-h-12 min-w-12 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={value}
              checked={context.preference === value}
              onChange={() => context.setPreference(value)}
              className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
            />
            <span className="flex min-h-12 w-full items-center justify-center rounded-lg px-1 text-base peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus">
              {label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
