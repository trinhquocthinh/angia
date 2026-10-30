import { useId, useState, type DragEvent } from 'react';
import { MAX_FILES_PER_PICK } from '../../application/uploadQueue';
import { DocumentIcon } from './DocumentIcon';

export const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif';

const dropHint = (disabled: boolean, blockedReason: string | null) =>
  disabled
    ? (blockedReason ?? 'Đang gửi ảnh, chờ gửi xong rồi chọn thêm.')
    : `Hỗ trợ JPG, PNG, HEIC, WebP · Tối đa 30 MB mỗi ảnh, ảnh được che và nén trên máy trước khi gửi · Tối đa ${MAX_FILES_PER_PICK} ảnh mỗi lần chọn`;

export function UploadDropZone({
  disabled,
  blockedReason = null,
  onFiles,
}: {
  disabled: boolean;
  /** SPEC-030: lý do khóa do quota gia đình; null = khóa vì đang gửi. */
  blockedReason?: string | null;
  onFiles: (files: File[]) => void;
}) {
  const inputId = useId();
  const [over, setOver] = useState(false);
  const drag = (event: DragEvent, active: boolean) => {
    event.preventDefault();
    setOver(active && !disabled);
  };
  return (
    <label
      htmlFor={inputId}
      onDragEnter={(event) => drag(event, true)}
      onDragOver={(event) => drag(event, true)}
      onDragLeave={(event) => drag(event, false)}
      onDrop={(event) => {
        drag(event, false);
        if (!disabled) onFiles([...event.dataTransfer.files]);
      }}
      aria-disabled={disabled}
      className={`group flex flex-col items-center justify-center gap-1 rounded-2xl p-8 text-center shadow-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#286958] ${
        disabled
          ? 'cursor-not-allowed bg-white opacity-70'
          : `cursor-pointer hover:bg-[#eaf6f5] ${over ? 'bg-[#aef0da]/40' : 'bg-white'}`
      }`}
    >
      <input
        id={inputId}
        type="file"
        multiple
        accept={ACCEPT}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])]);
          event.target.value = '';
        }}
      />
      <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#aef0da] text-[#004135] shadow-sm transition-transform group-hover:scale-105 motion-reduce:transition-none">
        <DocumentIcon name="upload" size={32} />
      </span>
      <span className="auth-heading text-[22px] leading-7 font-semibold text-[#004135]">
        Kéo ảnh vào đây hoặc <span className="text-[#286958] underline underline-offset-4">Chọn ảnh</span>
      </span>
      <span className="mt-1 max-w-lg text-[15px] leading-6 text-[#404945]">
        {dropHint(disabled, blockedReason)}
      </span>
      <span className="mt-5 flex min-h-11 items-center gap-2 rounded-full bg-[#eaf6f5] px-6 text-sm font-semibold text-[#004135] transition-colors group-hover:bg-[#004135] group-hover:text-white motion-reduce:transition-none">
        <DocumentIcon name="image" /> Duyệt ảnh từ thiết bị
      </span>
    </label>
  );
}
