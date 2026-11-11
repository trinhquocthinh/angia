import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

// Provider đổi thuộc tính sau render; đăng ký tại DOM để canvas đọc đúng bộ token mới.
export function useDocumentTheme() {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.theme ?? 'light',
    () => 'light',
  );
}
