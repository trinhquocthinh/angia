type Props = { message: string | null; showSubmit: boolean; pending: boolean; canSubmit: boolean };

// Thông báo lỗi form/API và nút "Tạo đợt thuốc" (ẩn khi đang đối soát Thay thế/Song song).
export function ReuseFormFooter({ message, showSubmit, pending, canSubmit }: Props) {
  return (
    <>
      {message && (
        <p role="alert" className="rounded-xl bg-[#fdecea] p-3 text-sm">
          {message}
        </p>
      )}
      {showSubmit && (
        <button
          type="submit"
          disabled={pending || !canSubmit}
          className="min-h-11 rounded-xl bg-[#004135] px-4 text-sm font-semibold text-white disabled:opacity-55"
        >
          {pending ? 'Đang lưu…' : 'Tạo đợt thuốc'}
        </button>
      )}
    </>
  );
}
