export function ProfileLinkConfirm({
  question,
  pending,
  onConfirm,
  onCancel,
}: {
  question: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p role="status" className="m-0 text-[13px] leading-5 text-[#404945] [overflow-wrap:anywhere]">
        {question} Danh sách người nhận nhắc của hồ sơ sẽ bị xóa.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          className="min-h-11 flex-1 rounded-xl bg-[#004135] px-4 text-[13px] font-semibold text-white disabled:opacity-65"
          onClick={onConfirm}
        >
          Xác nhận
        </button>
        <button
          type="button"
          disabled={pending}
          className="min-h-11 flex-1 rounded-xl bg-[#e4f0f0] px-4 text-[13px] font-semibold text-[#004135] disabled:opacity-65"
          onClick={onCancel}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
