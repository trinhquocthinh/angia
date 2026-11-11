export function SelfSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={`Đang tải ${label}`}
      className="h-32 animate-pulse rounded-xl bg-surface motion-reduce:animate-none"
    />
  );
}

export function SelfLoadError({ label, retry }: { label: string; retry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] bg-danger-soft p-5 text-sm">
      <p>Không tải được {label}.</p>
      <button
        type="button"
        onClick={retry}
        className="min-h-11 rounded-xl bg-surface px-4 font-semibold text-accent"
      >
        Thử lại
      </button>
    </div>
  );
}
