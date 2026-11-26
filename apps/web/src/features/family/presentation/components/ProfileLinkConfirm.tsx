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
      <p role="status" className="m-0 text-caption text-text-secondary [overflow-wrap:anywhere]">
        {question} Danh sách người nhận nhắc của hồ sơ sẽ bị xóa.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          className="min-h-14 flex-1 rounded-xl bg-accent px-4 text-button-primary font-semibold text-on-accent disabled:opacity-65"
          onClick={onConfirm}
        >
          Xác nhận
        </button>
        <button
          type="button"
          disabled={pending}
          className="min-h-12 flex-1 rounded-xl bg-accent-soft px-4 text-button-secondary font-semibold text-accent disabled:opacity-65"
          onClick={onCancel}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
