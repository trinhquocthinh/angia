import { createContext } from 'react';

export const TextSizeContext = createContext<{
  largeText: boolean;
  setLargeText: (value: boolean) => void;
} | null>(null);
