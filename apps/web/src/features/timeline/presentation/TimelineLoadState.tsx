export function TimelineLoadState({ error, retry }: { error: unknown; retry: () => void }) {
  if (!error)
    return (
      <div role="status" className="profile-bento-card space-y-3 p-6 text-body text-text-secondary">
        <p>Đang tải dòng thời gian…</p>
        <div className="h-16 animate-pulse rounded-2xl bg-surface-container motion-reduce:animate-none" />
      </div>
    );
  const status = error instanceof Error && 'status' in error ? error.status : null;
  const message =
    status === 404
      ? 'Không tìm thấy hồ sơ này.'
      : status === 409
        ? 'Hồ sơ chưa được đồng ý lưu dữ liệu.'
        : status === 401 || status === 403
          ? 'Bạn không có quyền xem dòng thời gian này.'
          : 'Không thể tải dòng thời gian. Vui lòng thử lại.';
  return (
    <div
      role="alert"
      className="profile-bento-card flex flex-col items-start gap-3 border border-danger/20 bg-danger-soft p-6 text-caption text-text-primary"
    >
      <p className="text-body font-medium">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="min-h-btn cursor-pointer rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover"
      >
        Thử lại
      </button>
    </div>
  );
}
