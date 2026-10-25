import { useEffect, useRef } from 'react';

/** Mở `<dialog>` dạng modal khi gắn; khi gỡ thì đóng và trả focus về phần tử đã mở nó. */
export function useModalDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return ref;
}
