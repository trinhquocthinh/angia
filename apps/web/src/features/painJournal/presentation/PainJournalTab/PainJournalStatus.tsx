type Props = { error: Error | null; retry: () => void };
export function PainJournalStatus({ error, retry }: Props) {
  if (error)
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-xl border border-[#dce5e1] p-4 text-sm">
        <p>Không thể tải sổ đau nhức. Vui lòng thử lại.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-[#e4f0ef] px-4 text-[#004135]"
        >
          Thử lại
        </button>
      </div>
    );
  return (
    <div role="status" aria-label="Đang tải sổ đau nhức" className="flex flex-col gap-3">
      <span className="sr-only">Đang tải sổ đau nhức…</span>
      {[0, 1].map((index) => (
        <div
          key={index}
          aria-hidden="true"
          className="h-44 rounded-xl bg-[#e4f0ef] motion-safe:animate-pulse"
        />
      ))}
    </div>
  );
}
