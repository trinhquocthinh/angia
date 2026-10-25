type Props = { loading: boolean; error: boolean; retry: () => void };

// Design §6 "Tóm tắt tái khám": khung xương trang in, thẻ lỗi + "Thử lại", trạng thái chưa đủ dữ liệu.
export function SummaryStates({ loading, error, retry }: Props) {
  if (loading)
    return (
      <div role="status" aria-label="Đang tạo bản tóm tắt" className="flex justify-center">
        <div className="aspect-[210/297] w-full max-w-[794px] animate-pulse rounded-sm bg-white shadow-sm motion-reduce:animate-none" />
      </div>
    );
  if (error)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] bg-[#fdecea] p-5 text-sm">
        <p>Không tải được bản tóm tắt.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135]"
        >
          Thử lại
        </button>
      </div>
    );
  return (
    <div className="rounded-[20px] border-2 border-dashed border-[#d9e5e4] bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-[#131d1d]">Chưa đủ dữ liệu để kết xuất tóm tắt.</p>
      <p className="mt-1 text-sm text-[#404945]">
        Khoảng này chưa có thuốc, số đo, xét nghiệm hay giai đoạn dùng thuốc đã duyệt.
      </p>
    </div>
  );
}
