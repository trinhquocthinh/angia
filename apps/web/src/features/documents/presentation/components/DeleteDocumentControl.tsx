import { useState } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
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
        className="inline-flex min-h-btn items-center justify-center gap-2 rounded-2xl border border-danger/25 bg-danger-soft/45 px-5 text-button-secondary font-semibold text-danger transition-colors duration-200 enabled:cursor-pointer enabled:hover:bg-danger-soft disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger motion-reduce:transition-none"
        onClick={() => {
          setValue('');
          deletion.reset();
          setOpen(true);
        }}
      >
        <AdminIcon name="delete_outline" size={20} /> Xóa chứng từ
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
