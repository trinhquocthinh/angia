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
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-[#131d1d]/55 to-transparent"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ ảnh ${name}`}
        className="absolute right-2 top-2 flex h-9 w-9 cursor-pointer items-center before:absolute before:-inset-1 before:content-[''] justify-center rounded-full bg-[#273232]/70 text-white shadow-md backdrop-blur-sm transition-[background-color,scale] duration-150 hover:bg-[#273232] active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <DocumentIcon name="close" size={16} />
      </button>
      <button
        type="button"
        onClick={onRedact}
        className={`absolute inset-x-3 bottom-3 min-h-11 cursor-pointer rounded-xl px-2 text-xs font-semibold shadow-md transition-[background-color,scale] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] motion-reduce:transition-none motion-reduce:active:scale-100 ${
          ready
            ? 'bg-white/90 text-[#004135] backdrop-blur-sm hover:bg-white'
            : 'bg-[#004135] text-white hover:bg-[#20594b]'
        }`}
      >
        {ready ? 'Chỉnh lại' : 'Che thông tin'}
      </button>
    </>
  );
}
