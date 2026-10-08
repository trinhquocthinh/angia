import type { usePrivacyWorkspace } from '../../application/usePrivacyWorkspace';
import { PrivacyDraftReview } from './PrivacyDraftReview';
type Props = { workspace: ReturnType<typeof usePrivacyWorkspace> };
export function PrivacyReviewPanel({ workspace }: Props) {
  const { state, dispatch, busy, error, query } = workspace;
  return (
    <div className="flex flex-col gap-4 rounded-[20px] bg-[#f6f9f8] p-4">
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
        busy={busy || query.isError}
        dispatch={dispatch}
        onApprove={() => void workspace.approve()}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void workspace.manual()}
        className="min-h-11 rounded-xl border border-[#d6e5df] bg-white px-4 text-sm font-medium text-[#004135] disabled:opacity-40"
      >
        Chọn nhập tay
      </button>
    </div>
  );
}
