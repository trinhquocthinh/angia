import { useEffect, useRef } from 'react';
import type { AdminDialogProps } from '../AdminDialogProps';
import { ActionForm } from './ActionForm';

export function ActionDialog(props: AdminDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="m-auto max-h-[calc(100dvh_-_32px)] w-[min(480px,_calc(100vw_-_32px))] overflow-y-auto rounded-[24px] border border-border/40 bg-surface p-6 text-text-primary shadow-stitch-md [&::backdrop]:bg-overlay/35 [&_*]:box-border [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-focus [&_button:disabled]:cursor-default [&_button:disabled]:opacity-65 [&_fieldset]:m-0 [&_fieldset]:grid [&_fieldset]:min-w-0 [&_fieldset]:gap-4 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_form]:grid [&_form]:gap-5 [&_label]:grid [&_label]:gap-2 [&_label]:text-caption [&_label]:font-medium [&_p]:text-caption motion-reduce:transition-none"
      aria-labelledby="admin-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!props.pending) props.onClose();
      }}
    >
      <ActionForm {...props} />
    </dialog>
  );
}
