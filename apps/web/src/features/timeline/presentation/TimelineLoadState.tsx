export function TimelineLoadState({ error, retry }: { error: unknown; retry: () => void }) {
  if (!error)
    return (
      <p role="status" className="rounded-xl bg-white p-6 text-sm">
        Đang tải dòng thời gian…
      </p>
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
    <div role="alert" className="flex flex-col items-start gap-3 rounded-xl bg-white p-6 text-sm">
      <p>{message}</p>
      <button
        type="button"
        onClick={retry}
        className="min-h-11 rounded-full bg-[#004135] px-5 font-semibold text-white"
      >
        Thử lại
      </button>
    </div>
  );
}
