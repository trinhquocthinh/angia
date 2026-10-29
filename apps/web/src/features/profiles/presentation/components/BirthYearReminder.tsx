export function BirthYearReminder({ onEdit }: { onEdit: () => void }) {
  return (
    <div
      role="status"
      className="flex flex-1 flex-wrap items-center justify-between gap-3 rounded-xl bg-[#e4f0f0] px-4 py-3 text-sm text-[#004135]"
    >
      <p>Bổ sung năm sinh để AN GIA hiển thị đúng mục theo độ tuổi.</p>
      <button
        type="button"
        onClick={onEdit}
        className="min-h-11 cursor-pointer rounded-xl px-3 font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-3"
      >
        Bổ sung
      </button>
    </div>
  );
}
