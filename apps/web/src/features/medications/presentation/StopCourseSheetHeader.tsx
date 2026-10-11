export function StopCourseSheetHeader({
  name,
  pending,
  onClose,
}: {
  name: string;
  pending: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <h2 id="stop-course-title" className="text-xl font-semibold text-[#004135]">
        Ghi nhận dừng thuốc cho {name}
      </h2>
      <button
        type="button"
        disabled={pending}
        onClick={onClose}
        aria-label="Đóng ghi nhận dừng thuốc"
        className="min-h-11 rounded-xl border border-[#cbd7d2] px-3"
      >
        Đóng
      </button>
    </div>
  );
}
