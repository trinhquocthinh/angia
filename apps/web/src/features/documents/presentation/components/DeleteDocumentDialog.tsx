import { useId } from 'react';
import type { DocumentDeletionImpact } from '@angia/contracts';
import { DeleteDocumentConfirmation } from './DeleteDocumentConfirmation';
import { DeleteDocumentImpact } from './DeleteDocumentImpact';
import { ModalDialog } from '@src/shared/ui/ModalDialog';

type Props = {
  impact: DocumentDeletionImpact | null;
  value: string;
  busy: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
};

export function DeleteDocumentDialog(props: Props) {
  const { impact, value, busy, error } = props;
  const id = useId();
  const canConfirm = impact !== null && !busy && value === 'XÓA';
  return (
    <ModalDialog
      labelledBy={`${id}-title`}
      role="alertdialog"
      pending={busy}
      onCancel={props.onCancel}
      width="md"
    >
      <form
        className="flex flex-col gap-4 overflow-y-auto p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (canConfirm) props.onConfirm();
        }}
      >
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          Xóa chứng từ vĩnh viễn?
        </h2>
        <p className="text-sm">Ảnh và bản trích xuất của chứng từ sẽ bị xóa. Không thể khôi phục.</p>
        {impact ? (
          <DeleteDocumentImpact impact={impact} />
        ) : (
          !error && <p role="status">Đang tải tác động xóa…</p>
        )}
        {error && (
          <p role="alert" className="text-sm text-[#a32622]">
            {error}
          </p>
        )}
        {!impact && error && (
          <button type="button" disabled={busy} onClick={props.onRetry}>
            Thử lại
          </button>
        )}
        <DeleteDocumentConfirmation
          inputId={`${id}-confirm`}
          value={value}
          busy={busy}
          canConfirm={canConfirm}
          onChange={props.onChange}
          onCancel={props.onCancel}
        />
      </form>
    </ModalDialog>
  );
}
