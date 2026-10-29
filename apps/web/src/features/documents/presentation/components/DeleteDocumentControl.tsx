import { useState } from 'react';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { ReviewRepository } from '../../application/reviewPorts';
import { useDeleteDocument } from '../../application/useDeleteDocument';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';

type Props = {
  repository: ReviewRepository;
  session: ProfileSession;
  documentId: string;
  profileId: string;
  disabled?: boolean;
  onDeleted: () => void;
};

export function DeleteDocumentControl({
  repository,
  session,
  documentId,
  profileId,
  disabled = false,
  onDeleted,
}: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const deletion = useDeleteDocument(repository, session, documentId, profileId, open);
  if (session.role !== 'main') return null;
  return (
    <>
      <button
        type="button"
        disabled={disabled || deletion.pending}
        className="min-h-11 rounded-lg border border-[#a32622] px-4 text-sm font-semibold text-[#a32622] disabled:opacity-55"
        onClick={() => {
          setValue('');
          deletion.reset();
          setOpen(true);
        }}
      >
        Xóa chứng từ
      </button>
      {open && (
        <DeleteDocumentDialog
          impact={deletion.impact}
          value={value}
          busy={deletion.pending}
          error={deletion.error}
          onChange={setValue}
          onRetry={deletion.retry}
          onCancel={() => {
            if (!deletion.pending) setOpen(false);
          }}
          onConfirm={() => {
            if (value !== 'XÓA') return;
            void deletion.remove().then((removed) => {
              if (removed) {
                setOpen(false);
                onDeleted();
              }
            });
          }}
        />
      )}
    </>
  );
}
