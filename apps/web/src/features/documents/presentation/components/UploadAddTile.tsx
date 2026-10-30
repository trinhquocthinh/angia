import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { ACCEPT } from './UploadDropZone';

// Ô cuối lưới ảnh: chọn thêm mà không phải cuộn lại vùng thả ảnh.
export function UploadAddTile({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <label className="flex h-full min-h-44 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl bg-[#eaf6f5]/70 p-4 text-center transition-colors hover:bg-[#e4f0f0] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#286958]">
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
      <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#e4f0f0] text-[#286958]">
        <DocumentIcon name="plus" />
      </span>
      <span className="text-xs font-semibold text-[#404945]">Thêm ảnh khác</span>
      <span className="text-[11px] text-[#55615f]">Tối đa {MAX_FILES_PER_PICK} ảnh mỗi lần chọn</span>
    </label>
  );
}
