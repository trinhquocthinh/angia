type Props = { message: string | null; showSubmit: boolean; pending: boolean; canSubmit: boolean };

// Thông báo lỗi form/API và nút "Tạo đợt thuốc" (ẩn khi đang đối soát Thay thế/Song song).
export function ReuseFormFooter({ message, showSubmit, pending, canSubmit }: Props) {
  return (
    <>
      {message && (
        <p role="alert" className="rounded-xl bg-danger-soft p-3 text-body">
          {message}
        </p>
      )}
      {showSubmit && (
        <button
          type="submit"
          disabled={pending || !canSubmit}
          className="min-h-14 rounded-xl bg-accent px-4 text-button-primary font-semibold text-on-accent disabled:opacity-55"
        >
          {pending ? 'Đang lưu…' : 'Tạo đợt thuốc'}
        </button>
      )}
    </>
  );
}
