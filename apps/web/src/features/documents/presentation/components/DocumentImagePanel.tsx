import { useState } from 'react';
import type { SourceDocument } from '../../application/reviewPorts';
import { documentImageUrl } from '../../infrastructure/createReviewRepository';
import { DocumentIcon } from './DocumentIcon';

const FORMAT: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'image/heic': 'HEIC',
};
const sizeLabel = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
const action =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 text-sm font-medium text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]';

// Ảnh gốc qua API (cùng cookie phiên). HEIC chưa có bản xem trước tới E3-S2-T1: trình duyệt không hiển thị được thì báo + link mở ảnh gốc.
export function DocumentImagePanel({ document }: { document: SourceDocument }) {
  const [turns, setTurns] = useState(0);
  const [failed, setFailed] = useState(false);
  const original = documentImageUrl(document.id, 'original');
  return (
    <section
      aria-label="Ảnh chứng từ gốc"
      className="flex flex-col gap-3 rounded-[20px] bg-[#eaf6f5] p-3 lg:h-full"
    >
      <div className="flex items-center justify-between gap-2 px-1 text-xs font-semibold uppercase tracking-wider text-[#286958]">
        <span>Ảnh chứng từ gốc</span>
        <span className="rounded-md bg-white px-2 py-1 font-mono text-[11px] text-[#55615f]">
          {FORMAT[document.mimeType] ?? 'ẢNH'} · {sizeLabel(document.sizeBytes)}
        </span>
      </div>
      <div className="flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-2xl bg-white">
        {failed ? (
          <div className="flex max-w-xs flex-col items-center gap-3 p-6 text-center text-sm text-[#55615f]">
            <DocumentIcon name="image" size={40} />
            <p>
              Trình duyệt này chưa xem trước được ảnh {FORMAT[document.mimeType] ?? ''}. Mở ảnh gốc để đối
              chiếu.
            </p>
          </div>
        ) : (
          <img
            src={documentImageUrl(document.id)}
            alt="Ảnh chứng từ đang duyệt"
            onError={() => setFailed(true)}
            style={{ transform: `rotate(${turns * 90}deg)` }}
            className="max-h-[70vh] w-full object-contain transition-transform motion-reduce:transition-none"
          />
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={action}
          onClick={() => setTurns((turn) => (turn + 1) % 4)}
          disabled={failed}
        >
          <DocumentIcon name="refresh" size={18} /> Xoay
        </button>
        <a className={action} href={original} target="_blank" rel="noreferrer">
          <DocumentIcon name="arrow" size={18} /> Mở ảnh gốc
        </a>
      </div>
    </section>
  );
}
