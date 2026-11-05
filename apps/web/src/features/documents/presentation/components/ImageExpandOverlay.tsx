import { DocumentIcon } from './DocumentIcon';

// Lớp phủ đáy khung ảnh ở di động: dải tối để chữ trắng đọc được trên mọi ảnh, chỉ nút nhận thao tác chạm.
export function ImageExpandOverlay({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end rounded-b-xl bg-linear-to-t from-[#131d1d]/60 to-transparent p-2 pt-8 xl:hidden">
      <button
        type="button"
        onClick={onExpand}
        className="pointer-events-auto flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-[13px] font-semibold text-white transition-[scale] duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
      >
        <DocumentIcon name="expand" size={16} /> Xem toàn màn hình
      </button>
    </div>
  );
}
