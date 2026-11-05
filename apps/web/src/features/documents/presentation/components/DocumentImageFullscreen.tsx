import '@src/shared/ui/modal-motion.css';
import { useModalDialog } from '@src/shared/ui/useModalDialog';
import { DocumentIcon } from './DocumentIcon';
import { DocumentImageViewer } from './DocumentImageViewer';

type Props = { src: string; turns: number; onError: () => void; onRotate: () => void; onClose: () => void };

// Khung ảnh ở di động thấp để còn thấy form: mở toàn màn hình khi cần đọc kỹ từng dòng thuốc.
export function DocumentImageFullscreen({ src, turns, onError, onRotate, onClose }: Props) {
  const ref = useModalDialog();
  return (
    <dialog
      ref={ref}
      aria-labelledby="document-image-fullscreen-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="angia-modal fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col gap-3 border-0 bg-white p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[#131d1d] open:flex"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="document-image-fullscreen-title" className="px-1 text-[15px] font-semibold text-[#004135]">
          Hình chụp giấy tờ
        </h2>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="Đóng xem toàn màn hình"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#eaf6f5] text-[#404945] transition-colors duration-200 hover:bg-[#deebea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] motion-reduce:transition-none"
        >
          <DocumentIcon name="close" size={18} />
        </button>
      </div>
      <DocumentImageViewer src={src} turns={turns} onError={onError} onRotate={onRotate} />
    </dialog>
  );
}
