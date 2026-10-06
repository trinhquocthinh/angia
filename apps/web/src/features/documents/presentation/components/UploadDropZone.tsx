import { useId, useState, type DragEvent } from 'react';
import { DocumentIcon } from './DocumentIcon';

const ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif';

export function UploadDropZone({
  disabled,
  onFiles,
}: {
  disabled: boolean;
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
      className={`group flex flex-col items-center justify-center gap-1 rounded-xl p-8 text-center shadow-sm transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#286958] ${
        disabled
          ? 'cursor-not-allowed bg-[#eaf6f5]/70 opacity-70'
          : `cursor-pointer hover:bg-[#deebea]/60 ${over ? 'bg-[#aef0da]/40' : 'bg-[#eaf6f5]/70'}`
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
      <span className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#aef0da] text-[#2f6f5e] transition-transform group-hover:scale-105 motion-reduce:transition-none">
        <DocumentIcon name="upload" size={30} />
      </span>
      <span className="auth-heading text-xl font-semibold text-[#004135]">
        Kéo ảnh vào đây hoặc{' '}
        <span className="text-[#286958] underline decoration-[#286958]/40 underline-offset-4">Chọn ảnh</span>
      </span>
      <span className="mt-1 max-w-[480px] text-[13px] leading-5 text-[#404945]">
        {disabled
          ? 'Chọn hồ sơ đã đồng thuận ở mục “Của ai?” trước.'
          : 'Hỗ trợ JPG, PNG, HEIC, WebP · Tối đa 10 MB mỗi ảnh · Tối đa 50 ảnh mỗi lần chọn'}
      </span>
      <span className="mt-4 flex min-h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#004135] shadow-sm transition-colors group-hover:bg-[#004135] group-hover:text-white">
        <DocumentIcon name="image" /> Duyệt ảnh từ thiết bị
      </span>
    </label>
  );
}
