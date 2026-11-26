import { DocumentIcon } from './DocumentIcon';

// Nút thêm dòng cuối danh sách theo Stitch bb3e9ab1: viền nét đứt bo lớn, nhấn mềm khi rê chuột.
export function AddRowButton({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group inline-flex min-h-btn w-full cursor-pointer items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-border bg-surface/60 px-4 text-button-secondary font-semibold text-secondary transition-[background-color,border-color,color,scale] duration-200 hover:border-secondary hover:bg-accent-soft/75 hover:text-accent active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <span className="transition-[rotate] duration-200 ease-out group-hover:rotate-90 motion-reduce:transition-none motion-reduce:group-hover:rotate-0">
        <DocumentIcon name="plus" size={18} />
      </span>
      {label}
    </button>
  );
}
