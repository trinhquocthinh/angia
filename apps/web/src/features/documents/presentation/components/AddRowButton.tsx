import { DocumentIcon } from './DocumentIcon';

// Nút thêm dòng cuối danh sách của form nhiều dòng ("Thêm thuốc", "Thêm chỉ số").
export function AddRowButton({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#deebea]/70 px-4 text-sm font-semibold text-[#004135] transition-[background-color,scale] duration-200 hover:bg-[#deebea] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <span className="transition-[rotate] duration-200 ease-out group-hover:rotate-90 motion-reduce:transition-none motion-reduce:group-hover:rotate-0">
        <DocumentIcon name="plus" size={18} />
      </span>
      {label}
    </button>
  );
}
