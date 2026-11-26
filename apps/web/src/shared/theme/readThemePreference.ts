import type { ThemePreference } from './ThemeContext';

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem('angia-theme');
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    // Trình duyệt chặn storage: vẫn cho phép dùng nền theo máy (TC-856).
  }
  return 'system';
}
