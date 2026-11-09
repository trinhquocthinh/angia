import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ModalDialog } from '@src/shared/ui/ModalDialog';
import type { PainIssueReader } from '../../application/ports';
import type { PainIssueHandoff } from '../../application/painIssueHandoff';
import { painIssueWriteKey } from '../../application/painIssueWriteKey';
import { QuickPainEntrySheet } from './QuickPainEntrySheet';
import type { QuickPainEntryProps } from './quickPainEntryTypes';

type Props = Omit<QuickPainEntryProps, 'issue' | 'draft' | 'message'> & {
  api: QuickPainEntryProps['api'] & PainIssueReader;
  handoff: Extract<PainIssueHandoff, { kind: 'existing' }>;
};
export function QuickPainEntryHandoff({ handoff, ...props }: Props) {
  const id = useId();
  const query = useQuery({
    queryKey: [
      'profiles',
      props.session.account.id,
      props.session.family?.id,
      'pain',
      props.scope,
      props.profile.id,
      'detail',
      handoff.issueId,
      painIssueWriteKey(props.session, props.profile, props.scope),
    ],
    queryFn: ({ signal }) =>
      props.api.detail(props.scope === 'self' ? null : props.profile.id, handoff.issueId, signal),
    retry: false,
  });
  if (query.data && !query.error)
    return (
      <QuickPainEntrySheet {...props} issue={query.data} draft={handoff.draft} message={handoff.message} />
    );
  return (
    <ModalDialog labelledBy={id} onCancel={props.onClose} pending={false} width="lg">
      <div className="space-y-3 p-5">
        <h2 id={id}>Ghi mức đau</h2>
        {query.error ? (
          <>
            <p role="alert">Không thể mở vấn đề đau. Bản nháp vẫn được giữ.</p>
            <button
              type="button"
              className="min-h-11 underline"
              onClick={() => {
                void query.refetch();
              }}
            >
              Thử lại
            </button>
          </>
        ) : (
          <p role="status">Đang mở vấn đề đau…</p>
        )}
        <button type="button" className="min-h-11 px-3" onClick={props.onClose}>
          Đóng
        </button>
      </div>
    </ModalDialog>
  );
}
