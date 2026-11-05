import { useState } from 'react';
import type { SourceDocument } from '../../application/reviewPorts';
import { documentImageUrl } from '../../infrastructure/createReviewRepository';
import { DocumentIcon } from './DocumentIcon';
import { DocumentImageFullscreen } from './DocumentImageFullscreen';
import { DocumentImageViewer } from './DocumentImageViewer';

const sizeLabel = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
function ImageNotice({ text }: { text: string }) {
  return (
    <div className="flex min-h-48 flex-1 items-center justify-center rounded-xl bg-[#eaf6f5]">
      <div className="flex max-w-xs flex-col items-center gap-3 p-6 text-center text-sm text-[#55615f]">
        <DocumentIcon name="image" size={40} />
        <p>{text}</p>
      </div>
    </div>
  );
}

// Server chỉ giữ một bản đã che (BR-012), JPEG nên trình duyệt nào cũng hiển thị được.
// Desktop (xl): khung dính theo màn hình khi cuộn form dài, ảnh cuộn/phóng riêng bên trong.
export function DocumentImagePanel({ document }: { document: SourceDocument }) {
  const [turns, setTurns] = useState(0);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const rotate = () => setTurns((turn) => (turn + 1) % 4);
  const viewerProps = {
    src: documentImageUrl(document.id),
    turns,
    onError: () => setFailed(true),
    onRotate: rotate,
  };
  return (
    <section
      aria-label="Hình chụp giấy tờ"
      className="flex flex-col gap-2 overflow-hidden rounded-[20px] bg-white p-3 shadow-card xl:sticky xl:top-[88px] xl:h-[calc(100dvh-104px)] xl:self-start"
    >
      <div className="flex items-center justify-between gap-2 px-1 text-[#404945]">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[#004135]">
          <DocumentIcon name="image" size={16} /> Hình chụp giấy tờ
        </span>
        {document.hasImage && (
          <span className="text-xs font-medium tabular-nums">JPG · {sizeLabel(document.sizeBytes)}</span>
        )}
      </div>
      {!document.hasImage ? (
        <ImageNotice text="Ảnh đã được xóa để bảo vệ riêng tư" />
      ) : failed ? (
        <ImageNotice text="Không hiển thị được ảnh. Vui lòng tải lại trang." />
      ) : (
        <DocumentImageViewer {...viewerProps} onExpand={() => setExpanded(true)} />
      )}
      {document.hasImage && (
        <p className="flex items-center gap-1.5 px-1 text-xs text-[#404945]">
          <span className="text-[#286958]">
            <DocumentIcon name="shield" size={16} />
          </span>
          Đây là bản đã che. AN GIA không lưu ảnh chưa che.
        </p>
      )}
      {expanded && document.hasImage && !failed && (
        <DocumentImageFullscreen {...viewerProps} onClose={() => setExpanded(false)} />
      )}
    </section>
  );
}
