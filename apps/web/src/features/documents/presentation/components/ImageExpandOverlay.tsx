import { DocumentIcon } from './DocumentIcon';

// Lớp phủ đáy khung ảnh ở di động theo Stitch 6f8ab883: nút kính mờ nổi bật trên mọi ảnh.
export function ImageExpandOverlay({ onExpand }: { onExpand: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end rounded-b-xl bg-linear-to-t from-overlay/65 via-overlay/20 to-transparent p-2.5 pt-10 xl:hidden">
      <button
        type="button"
        onClick={onExpand}
        className="pointer-events-auto flex min-h-12 cursor-pointer items-center gap-1.5 rounded-xl bg-overlay/85 px-3.5 text-button-secondary font-semibold text-on-overlay shadow-stitch-md backdrop-blur-md transition-[scale] duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none"
      >
        <DocumentIcon name="expand" size={16} /> Xem toàn màn hình
      </button>
    </div>
  );
}
