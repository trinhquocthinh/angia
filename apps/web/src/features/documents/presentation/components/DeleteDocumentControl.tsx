import { useState } from 'react';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { ReviewRepository } from '../../application/reviewPorts';
import { useDeleteDocument } from '../../application/useDeleteDocument';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';
import { DocumentIcon } from './DocumentIcon';

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
        className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#ffdad6]/40 px-4 text-sm font-semibold text-[#a32622] transition-colors duration-200 enabled:cursor-pointer enabled:hover:bg-[#ffdad6] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a32622] motion-reduce:transition-none"
        onClick={() => {
          setValue('');
          deletion.reset();
          setOpen(true);
        }}
      >
        <DocumentIcon name="trash" size={18} /> Xóa chứng từ
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
