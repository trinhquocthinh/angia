import { createContext } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

export const ThemeContext = createContext<{
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
} | null>(null);
