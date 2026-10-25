// Nút thêm dòng cuối danh sách của form nhiều dòng ("+ Thêm thuốc", "+ Thêm chỉ số").
export function AddRowButton({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-dashed border-[#6f7975] px-4 text-sm font-semibold text-[#004135] hover:bg-[#eaf6f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
    >
      + {label}
    </button>
  );
}
