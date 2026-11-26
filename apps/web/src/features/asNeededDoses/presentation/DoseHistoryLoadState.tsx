type Props = { loading: boolean; error: boolean; retry: () => void };
export function DoseHistoryLoadState({ loading, error, retry }: Props) {
  if (loading)
    return (
      <p
        role="status"
        className="rounded-2xl border border-border/35 bg-bg p-4 text-caption text-text-secondary"
      >
        Đang tải nhật ký liều…
      </p>
    );
  if (!error) return null;
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-2xl bg-danger-soft p-4 text-caption">
      <p className="text-body font-medium text-text-primary">Không tải được nhật ký liều.</p>
      <button
        type="button"
        onClick={retry}
        className="min-h-btn rounded-2xl bg-surface px-4 text-button-secondary font-semibold text-accent"
      >
        Thử lại
      </button>
    </div>
  );
}
