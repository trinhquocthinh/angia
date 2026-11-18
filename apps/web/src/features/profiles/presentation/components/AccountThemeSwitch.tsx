import { useContext, useId } from 'react';
import { ThemeContext } from '@src/shared/theme/ThemeContext';
import { AccountThemeIcon } from './AccountThemeIcon';
const options = [
  ['light', 'Sáng', 'Chế độ Sáng'],
  ['dark', 'Tối', 'Chế độ Tối'],
  ['system', 'Hệ thống', 'Tự động theo hệ thống'],
] as const;
export function AccountThemeSwitch() {
  const theme = useContext(ThemeContext);
  const id = useId();
  if (!theme) throw new Error('AccountThemeSwitch cần ThemeProvider');
  return (
    <fieldset className="account-menu-theme">
      <legend className="sr-only">Nền giao diện</legend>
      <div className="account-menu-theme-heading" aria-hidden="true">
        <span>Nền giao diện</span>
        <strong>{options.find(([mode]) => mode === theme.preference)?.[1]}</strong>
      </div>
      <div className="account-menu-theme-options">
        {options.map(([mode, label, accessible]) => (
          <label key={mode} title={label}>
            <input
              type="radio"
              name={id}
              value={mode}
              aria-label={accessible}
              checked={theme.preference === mode}
              onChange={() => theme.setPreference(mode)}
            />
            <span>
              <AccountThemeIcon mode={mode} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
