import { useEffect, useRef, type RefObject } from 'react';

/** Mở `<dialog>` dạng modal khi gắn; khi gỡ thì đóng và trả focus về phần tử đã mở nó. */
export function useModalDialog(returnFocusRef?: RefObject<HTMLButtonElement | null>) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = returnFocusRef?.current ?? document.activeElement;
    const fallback = ref.current?.closest<HTMLElement>('[data-modal-return-focus]');
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
      else if (fallback?.isConnected) fallback.focus();
    };
  }, [returnFocusRef]);
  return ref;
}
