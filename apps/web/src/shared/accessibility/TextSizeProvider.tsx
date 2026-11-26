import { useLayoutEffect, useState, type ReactNode } from 'react';
import { TextSizeContext } from './TextSizeContext';
import { readLargeText } from './readLargeText';
import { storeLargeText } from './storeLargeText';

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [largeText, setValue] = useState(readLargeText);
  useLayoutEffect(() => {
    document.documentElement.dataset.textSize = largeText ? 'large' : 'standard';
  }, [largeText]);

  function setLargeText(value: boolean) {
    setValue(value);
    storeLargeText(value);
  }

  return <TextSizeContext value={{ largeText, setLargeText }}>{children}</TextSizeContext>;
}
