import { revealStyle } from '@src/shared/ui/revealStyle';
import { useId, useState, type DragEvent } from 'react';
import { UploadDropContent } from './UploadDropContent';

export const ACCEPT =
  '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif';

const ZONE_STATE = {
  disabled: 'cursor-not-allowed border-[#bfc9c4] bg-white opacity-70',
  idle: 'cursor-pointer border-[#bfc9c4] bg-white hover:border-[#286958]/60 hover:bg-[#f6fcfb]',
  // Con không nhận sự kiện kéo để dragleave không nháy khi lướt qua chữ/biểu tượng.
  over: 'scale-[1.01] cursor-copy border-[#286958] bg-[#aef0da]/30 shadow-md *:pointer-events-none',
};

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
      style={revealStyle(5)}
      className={`angia-modal-reveal group flex flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed p-8 text-center shadow-sm transition-[background-color,border-color,box-shadow,scale] duration-200 ease-out focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#286958] motion-reduce:transition-none max-sm:p-6 ${
        ZONE_STATE[disabled ? 'disabled' : over ? 'over' : 'idle']
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
      <UploadDropContent over={over} disabled={disabled} blockedReason={blockedReason} />
    </label>
  );
}
