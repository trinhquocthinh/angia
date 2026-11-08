import { usePainIssueLifecycle } from '../../application/usePainIssueLifecycle';
import { usePainIssueDeletionImpact } from '../../application/usePainIssueDeletionImpact';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
import { PainIssueLifecycleDialog } from '../PainIssueDetail/PainIssueLifecycleDialog';
import type { PainIssueLifecycleProps } from '../PainIssueDetail/painIssueLifecycleTypes';
export function DeletePainIssueDialog(props: PainIssueLifecycleProps) {
  const state = usePainIssueLifecycle(props.api, props.session, props.profile, props.scope, props.issue.id);
  const impact = usePainIssueDeletionImpact(
    props.api,
    props.session,
    props.profile,
    props.scope,
    props.issue.id,
  );
  return (
    <PainIssueLifecycleDialog
      title={`Xóa vĩnh viễn ${describeBodyLocation(props.issue)}?`}
      confirmLabel="Xóa vấn đề"
      cancelLabel="Giữ lại"
      danger
      pending={state.pending}
      disabled={!state.enabled || !impact.data}
      error={state.error}
      onClose={props.onClose}
      onConfirm={async () => {
        if (await state.run({ kind: 'delete' })) props.onDeleted();
      }}
    >
      {impact.data ? (
        <p>
          <strong>
            {impact.data.entryCount} lần ghi và {impact.data.exerciseCount} bài tập
          </strong>{' '}
          sẽ bị xóa, không khôi phục được.
        </p>
      ) : impact.isError ? (
        <div>
          <p role="alert">Không thể tải tác động xóa. Vui lòng thử lại.</p>
          <button
            type="button"
            className="min-h-11 underline"
            onClick={() => {
              void impact.refetch();
            }}
          >
            Thử lại
          </button>
        </div>
      ) : (
        <p role="status">Đang tải tác động xóa…</p>
      )}
    </PainIssueLifecycleDialog>
  );
}
