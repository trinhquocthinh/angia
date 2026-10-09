import type { usePrivacyWorkspace } from '../../application/usePrivacyWorkspace';
import { PrivacyDraftReview } from './PrivacyDraftReview';
type Props = { workspace: ReturnType<typeof usePrivacyWorkspace>; inputPending: boolean };
export function PrivacyReviewPanel({ workspace, inputPending }: Props) {
  const { state, dispatch, busy, error, query } = workspace;
  return (
    <div className="flex flex-col gap-3">
      {query.isPending && (
        <p role="status" className="text-sm text-[#55615f]">
          Đang tải trạng thái kiểm tra…
        </p>
      )}
      {query.isError && (
        <div role="alert" className="text-sm text-[#9b472c]">
          Không đọc được trạng thái kiểm tra.
          <button
            type="button"
            disabled={busy}
            onClick={() => void query.refetch()}
            className="ml-2 min-h-11 underline"
          >
            Tải lại trạng thái
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-[#9b472c]">
          {error}
        </p>
      )}
      <PrivacyDraftReview
        key={
          state.candidate.state === 'ready'
            ? `${state.candidate.draftId}:${state.candidate.sha256}`
            : state.candidate.state
        }
        state={state}
        busy={busy || query.isError || inputPending}
        dispatch={dispatch}
        onApprove={() => {
          if (!inputPending) void workspace.approve();
        }}
      />
    </div>
  );
}
