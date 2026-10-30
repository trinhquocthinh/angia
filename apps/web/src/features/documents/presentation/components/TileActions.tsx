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
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#273232]/80 text-white shadow-md transition-colors hover:bg-[#273232] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
      >
        <DocumentIcon name="close" size={16} />
      </button>
      <button
        type="button"
        onClick={onRedact}
        className={`absolute inset-x-3 bottom-3 min-h-10 rounded-lg px-2 text-xs font-semibold shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] ${
          ready ? 'bg-white/90 text-[#004135] hover:bg-white' : 'bg-[#004135] text-white hover:bg-[#20594b]'
        }`}
      >
        {ready ? 'Chỉnh lại' : 'Che thông tin'}
      </button>
    </>
  );
}
