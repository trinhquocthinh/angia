import { useId } from 'react';
import { useModalDialog } from '@src/shared/ui/useModalDialog';
import '@src/shared/ui/modal-motion.css';

type Props = { pending: boolean; error: string | null; onClose: () => void; onConfirm: () => void };
export function FoundingInvitationRevokeDialog({ pending, error, onClose, onConfirm }: Props) {
  const ref = useModalDialog();
  const id = useId();
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      aria-busy={pending}
      className="angia-modal m-auto max-h-[calc(100dvh_-_32px)] w-[min(480px,_calc(100vw_-_32px))] overflow-y-auto rounded-3xl border border-border bg-surface p-6 text-text-primary shadow-stitch-md backdrop:bg-overlay/35"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
    >
      <h2 id={id} className="mt-0 auth-heading text-heading-2">
        Thu hồi lời mời này?
      </h2>
      <p>Người nhận sẽ không dùng được mã hoặc link này nữa.</p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          data-autofocus
          disabled={pending}
          onClick={onClose}
          className="min-h-12 rounded-2xl border border-border bg-bg px-5"
        >
          Huỷ
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="min-h-12 rounded-2xl bg-accent px-5 text-on-accent"
        >
          {pending ? 'Đang thu hồi…' : 'Xác nhận'}
        </button>
      </div>
    </dialog>
  );
}
