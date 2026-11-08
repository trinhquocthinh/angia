import { usePainIssueLifecycle } from '../../application/usePainIssueLifecycle';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
import { PainIssueLifecycleDialog } from '../PainIssueDetail/PainIssueLifecycleDialog';
import type { PainIssueLifecycleProps } from '../PainIssueDetail/painIssueLifecycleTypes';
export function ReopenDialog(props: PainIssueLifecycleProps) {
  const state = usePainIssueLifecycle(props.api, props.session, props.profile, props.scope, props.issue.id);
  return (
    <PainIssueLifecycleDialog
      title={`Mở lại ${describeBodyLocation(props.issue)} để ghi tiếp?`}
      confirmLabel="Mở lại"
      cancelLabel="Giữ nguyên"
      pending={state.pending}
      disabled={!state.enabled || Boolean(state.existingIssueId)}
      error={state.error}
      onClose={props.onClose}
      onConfirm={async () => {
        if (await state.run({ kind: 'reopen' })) props.onSaved('Đã mở lại vấn đề đau.');
      }}
    >
      <p>Các lần ghi và bài tập trước đây được giữ lại.</p>
      {state.existingIssueId && (
        <button
          type="button"
          role="link"
          className="min-h-11 underline"
          disabled={state.pending}
          onClick={() => props.onOpenIssue(state.existingIssueId!)}
        >
          Mở vấn đề đó
        </button>
      )}
    </PainIssueLifecycleDialog>
  );
}
