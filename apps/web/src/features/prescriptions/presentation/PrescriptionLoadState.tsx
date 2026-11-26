export function PrescriptionLoadState({ error, retry }: { error?: unknown; retry: () => void }) {
  if (!error)
    return (
      <p role="status" className="profile-bento-card p-6 text-body text-text-secondary">
        Đang tải đơn thuốc…
      </p>
    );
  const status = error instanceof Error && 'status' in error ? error.status : null;
  const message =
    status === 404
      ? 'Không tìm thấy đơn thuốc hoặc hồ sơ này.'
      : status === 409
        ? 'Hồ sơ chưa được đồng ý lưu dữ liệu.'
        : status === 401 || status === 403
          ? 'Bạn không có quyền xem đơn thuốc này.'
          : 'Không thể tải đơn thuốc. Vui lòng thử lại.';
  return (
    <div role="alert" className="profile-bento-card flex flex-col items-start gap-3 p-6 text-caption">
      <p className="text-body font-medium text-text-primary">{message}</p>
      <button
        type="button"
        onClick={retry}
        className="min-h-btn rounded-2xl bg-accent px-5 text-button-secondary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover"
      >
        Thử lại
      </button>
    </div>
  );
}
