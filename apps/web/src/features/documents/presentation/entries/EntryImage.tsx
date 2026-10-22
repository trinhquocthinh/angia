import { useState } from 'react';
import { documentImageUrl } from '../../infrastructure/createReviewRepository';

const toggleClass =
  'min-h-11 flex-1 rounded-lg px-3 text-sm font-medium text-[#404945] aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-[#004135] aria-pressed:shadow-sm';

// Ảnh chứng từ dùng bản xem trước WebP (ảnh gốc HEIC trình duyệt không hiển thị được; chưa có preview
// thì API trả ảnh gốc). Công tắc "Ảnh gốc / Bản tự động nhận diện" chỉ khi đã có bản che (SPEC-028, variant=ocr).
export function EntryImage({ documentId, hasOcrImage }: { documentId: string; hasOcrImage: boolean }) {
  const [variant, setVariant] = useState<'preview' | 'ocr'>('preview');
  return (
    <div className="flex flex-col gap-3">
      {hasOcrImage && (
        <div role="group" aria-label="Chọn bản ảnh" className="flex gap-1 rounded-xl bg-[#eaf6f5] p-1">
          <button
            type="button"
            aria-pressed={variant === 'preview'}
            onClick={() => setVariant('preview')}
            className={toggleClass}
          >
            Ảnh gốc
          </button>
          <button
            type="button"
            aria-pressed={variant === 'ocr'}
            onClick={() => setVariant('ocr')}
            className={toggleClass}
          >
            Bản tự động nhận diện
          </button>
        </div>
      )}
      <img
        src={documentImageUrl(documentId, variant)}
        alt={variant === 'ocr' ? 'Bản đã che gửi tự động nhận diện' : 'Ảnh gốc giấy tờ'}
        className="w-full rounded-xl border border-[#d9e5e4] bg-[#f0fcfb] object-contain"
      />
    </div>
  );
}
