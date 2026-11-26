type Props = { loading: boolean; error: boolean; retry: () => void };

// Design §6 "Tóm tắt tái khám": khung xương trang in, thẻ lỗi + "Thử lại", trạng thái chưa đủ dữ liệu.
export function SummaryStates({ loading, error, retry }: Props) {
  if (loading)
    return (
      <div
        role="status"
        aria-label="Đang tạo bản tóm tắt"
        className="flex justify-center rounded-3xl border border-border/35 bg-surface-container/60 p-4 sm:p-6"
      >
        <div className="aspect-[210/297] w-full max-w-[794px] animate-pulse rounded-xl bg-surface shadow-stitch-sm motion-reduce:animate-none" />
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="profile-bento-card flex flex-col items-start gap-3 border border-danger/20 bg-danger-soft p-6 text-caption text-text-primary"
      >
        <p className="text-body font-medium">Không tải được bản tóm tắt.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-btn cursor-pointer rounded-2xl bg-surface px-5 text-button-secondary font-semibold text-accent shadow-2xs transition-colors hover:bg-accent-soft"
        >
          Thử lại
        </button>
      </div>
    );
  return (
    <div className="profile-bento-card border border-dashed border-border/60 px-6 py-12 text-center">
      <p className="text-body font-semibold text-text-primary">Chưa đủ dữ liệu để kết xuất tóm tắt.</p>
      <p className="mt-1.5 text-caption text-text-secondary">
        Khoảng này chưa có thuốc, số đo, xét nghiệm, giai đoạn dùng thuốc hay ghi nhận đau nhức.
      </p>
    </div>
  );
}
