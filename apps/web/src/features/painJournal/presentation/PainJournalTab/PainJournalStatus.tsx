type Props = { error: Error | null; retry: () => void };
export function PainJournalStatus({ error, retry }: Props) {
  if (error)
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-2xl bg-danger-soft p-5 text-caption"
      >
        <p className="text-body font-medium text-text-primary">
          Không thể tải sổ đau nhức. Vui lòng thử lại.
        </p>
        <button
          type="button"
          onClick={retry}
          className="min-h-btn rounded-2xl bg-surface px-4 text-button-secondary font-semibold text-accent"
        >
          Thử lại
        </button>
      </div>
    );
  return (
    <div role="status" aria-label="Đang tải sổ đau nhức" className="grid gap-3.5 md:grid-cols-2">
      <span className="sr-only">Đang tải sổ đau nhức…</span>
      {[0, 1].map((index) => (
        <div key={index} aria-hidden="true" className="h-44 rounded-3xl bg-bg motion-safe:animate-pulse" />
      ))}
    </div>
  );
}
