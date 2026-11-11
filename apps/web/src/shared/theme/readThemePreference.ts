import type { ThemePreference } from './ThemeContext';

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem('angia-theme');
    if (value === 'light' || value === 'dark') return value;
  } catch {
    // Trình duyệt chặn storage: vẫn cho phép dùng nền theo máy.
  }
  return 'system';
}
