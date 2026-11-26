import { useLayoutEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import type { ThemePreference } from './ThemeContext';
import { readThemeColor } from './readThemeColor';
import { readThemePreference } from './readThemePreference';
import { useSystemDark } from './useSystemDark';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setValue] = useState(readThemePreference);
  const systemDark = useSystemDark();
  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const bg = readThemeColor('bg');
    if (meta && bg) meta.content = bg;
  }, [theme]);

  function setPreference(value: ThemePreference) {
    setValue(value);
    try {
      localStorage.setItem('angia-theme', value);
    } catch {
      // Không lưu được: lựa chọn vẫn có hiệu lực trong phiên hiện tại.
    }
  }

  return <ThemeContext value={{ preference, setPreference }}>{children}</ThemeContext>;
}
