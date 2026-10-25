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
      className="admin-dialog [&_*]:box-border [&_h2]:text-[18px] [&_h2]:leading-[24px] [&_h2]:font-semibold [&_h2]:m-0 [&_button:disabled]:cursor-default [&_button:disabled]:opacity-65 [&_button:disabled]:transform-none [&_button:disabled]:shadow-none [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-[#286958] [&_:focus-visible]:outline-offset-3 w-[min(480px,_calc(100vw_-_32px))] max-h-[calc(100dvh_-_32px)] overflow-y-auto border-0 rounded-[20px] p-7 m-auto shadow-[0_24px_80px_#00413526] bg-white text-[#131d1d] [&::backdrop]:bg-[#00201959] [&_form]:grid [&_form]:gap-5 [&_fieldset]:border-0 [&_fieldset]:p-0 [&_fieldset]:m-0 [&_fieldset]:min-w-0 [&_fieldset]:grid [&_fieldset]:gap-4 [&_label]:grid [&_label]:gap-2 [&_label]:text-[13px] [&_label]:font-medium [&_p]:text-[13px] [&_p]:leading-[1.7] max-[600px]:p-5 motion-reduce:transition-none motion-reduce:[&_*]:transition-none motion-reduce:[&::backdrop]:transition-none"
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
