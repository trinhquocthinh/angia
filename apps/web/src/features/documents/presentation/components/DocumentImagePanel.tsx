import { useState } from 'react';
import type { SourceDocument } from '../../application/reviewPorts';
import { documentImageUrl } from '../../infrastructure/createReviewRepository';
import { DocumentIcon } from './DocumentIcon';
import { DocumentImageViewer } from './DocumentImageViewer';

const sizeLabel = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
const action =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-medium text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]';

function ImageNotice({ text }: { text: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-white">
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
  const viewable = document.hasImage && !failed;
  return (
    <section
      aria-label="Hình chụp giấy tờ"
      className="flex h-[65vh] flex-col gap-3 rounded-[20px] bg-[#eaf6f5] p-3 xl:sticky xl:top-[88px] xl:h-[calc(100dvh-104px)] xl:self-start"
    >
      <div className="flex items-center justify-between gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-[#286958]">
        <span>Hình chụp giấy tờ</span>
        {document.hasImage && (
          <span className="rounded-md bg-white px-2 py-1 font-mono text-[11px] text-[#55615f]">
            JPG · {sizeLabel(document.sizeBytes)}
          </span>
        )}
      </div>
      {!document.hasImage ? (
        <ImageNotice text="Ảnh đã được xóa để bảo vệ riêng tư" />
      ) : failed ? (
        <ImageNotice text="Không hiển thị được ảnh. Vui lòng tải lại trang." />
      ) : (
        <DocumentImageViewer
          src={documentImageUrl(document.id)}
          turns={turns}
          onError={() => setFailed(true)}
        />
      )}
      {document.hasImage && (
        <p className="px-1 text-xs text-[#404945]">Đây là bản đã che. AN GIA không lưu ảnh chưa che.</p>
      )}
      <button
        type="button"
        className={action}
        onClick={() => setTurns((turn) => (turn + 1) % 4)}
        disabled={!viewable}
      >
        <DocumentIcon name="refresh" size={18} /> Xoay
      </button>
    </section>
  );
}
