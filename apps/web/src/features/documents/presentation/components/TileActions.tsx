import { DocumentIcon } from './DocumentIcon';

// Nút bỏ ảnh và mở công cụ che, nằm đè lên ảnh; chỉ hiện khi ảnh còn sửa được.
export function TileActions({
  name,
  ready,
  onRemove,
  onRedact,
}: {
  name: string;
  ready: boolean;
  onRemove: () => void;
  onRedact: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ ảnh ${name}`}
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-overlay/70 text-on-overlay shadow-md backdrop-blur-sm transition-[background-color,scale] duration-150 hover:bg-overlay active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <DocumentIcon name="close" size={16} />
      </button>
      <button
        type="button"
        onClick={onRedact}
        className={`absolute inset-x-3 bottom-3 min-h-11 rounded-xl px-2 text-xs font-semibold shadow-md transition-[background-color,scale] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none motion-reduce:active:scale-100 ${
          ready
            ? 'bg-surface/90 text-accent backdrop-blur-sm hover:bg-surface'
            : 'bg-accent text-on-accent hover:bg-accent-hover'
        }`}
      >
        {ready ? 'Chỉnh lại' : 'Che thông tin'}
      </button>
    </>
  );
}
