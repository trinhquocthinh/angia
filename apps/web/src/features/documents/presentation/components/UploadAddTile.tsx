import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';
import { ACCEPT } from './UploadDropZone';

// Ô cuối lưới ảnh: chọn thêm mà không phải cuộn lại vùng thả ảnh.
export function UploadAddTile({ onFiles }: { onFiles: (files: File[]) => void }) {
  return (
    <label className="group flex h-full min-h-44 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-3xl border-2 border-dashed border-border bg-accent-soft/65 p-4 text-center transition-colors duration-200 hover:border-secondary hover:bg-accent-soft focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus motion-reduce:transition-none">
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
      <span className="doc-clay-tile-sm mb-1 text-accent transition-[rotate] duration-200 ease-out group-hover:rotate-90 motion-reduce:transition-none motion-reduce:group-hover:rotate-0">
        <DocumentIcon name="plus" />
      </span>
      <span className="text-caption font-semibold text-accent">Thêm ảnh khác</span>
      <span className="text-caption text-text-secondary">Tối đa {MAX_FILES_PER_PICK} ảnh mỗi lần chọn</span>
    </label>
  );
}
