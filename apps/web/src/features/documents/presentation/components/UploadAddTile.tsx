import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { ACCEPT } from './UploadDropZone';

// Ô cuối lưới ảnh: chọn thêm mà không phải cuộn lại vùng thả ảnh.
export function UploadAddTile({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <label className="group flex h-full min-h-44 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-[#bfc9c4] bg-[#eaf6f5]/70 p-4 text-center transition-colors duration-200 hover:border-[#286958]/60 hover:bg-[#e4f0f0] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#286958] motion-reduce:transition-none">
      <input
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />
      <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#286958] shadow-sm transition-[rotate] duration-200 ease-out group-hover:rotate-90 motion-reduce:transition-none motion-reduce:group-hover:rotate-0">
        <DocumentIcon name="plus" />
      </span>
      <span className="text-xs font-semibold text-[#404945]">Thêm ảnh khác</span>
      <span className="text-[11px] text-[#55615f]">Tối đa {MAX_FILES_PER_PICK} ảnh mỗi lần chọn</span>
    </label>
  );
}
