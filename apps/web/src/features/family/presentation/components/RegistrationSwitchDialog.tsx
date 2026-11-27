import { useId } from 'react';
import { useModalDialog } from '@src/shared/ui/useModalDialog';
import '@src/shared/ui/modal-motion.css';

type Props = {
  open: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};
export function RegistrationSwitchDialog({ open, pending, error, onClose, onConfirm }: Props) {
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
        {open ? 'Mở đăng ký công khai?' : 'Tắt đăng ký công khai?'}
      </h2>
      <p>
        {open
          ? 'Bất kỳ ai cũng có thể tự tạo tài khoản.'
          : 'Người mới chỉ đăng ký được khi có lời mời lập nhà hoặc lời mời vào nhà.'}
      </p>
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
          {pending ? 'Đang lưu…' : 'Xác nhận'}
        </button>
      </div>
    </dialog>
  );
}
