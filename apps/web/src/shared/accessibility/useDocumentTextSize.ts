import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-text-size'] });
  return () => observer.disconnect();
}

export function useDocumentTextSize() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.textSize ?? 'standard',
    () => 'standard',
  );
}
