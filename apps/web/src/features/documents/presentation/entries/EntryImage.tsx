import { documentImageUrl } from '../../infrastructure/createReviewRepository';

const imageClass = 'w-full rounded-xl border border-[#d9e5e4] bg-[#f0fcfb] object-contain';

// Ảnh chứng từ dùng bản xem trước WebP (ảnh gốc HEIC trình duyệt không hiển thị được; chưa có preview
// thì API trả ảnh gốc). Ảnh gốc là căn cứ đối chiếu (BR-012) nên hiện mặc định, kèm chú thích nơi lưu để
// không bị hiểu nhầm là đã gửi đi. Bản đã che gửi AI (SPEC-028, variant=ocr) để trong mục mở rộng cho
// người dùng tự kiểm chứng, không đặt ngang hàng với ảnh gốc.
export function EntryImage({ documentId, hasOcrImage }: { documentId: string; hasOcrImage: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <figure className="flex flex-col gap-2">
        <img src={documentImageUrl(documentId, 'preview')} alt="Ảnh gốc giấy tờ" className={imageClass} />
        <figcaption className="text-xs text-[#404945]">
          Ảnh gốc chỉ lưu trong kho riêng của gia đình, không gửi ra ngoài.
        </figcaption>
      </figure>
      {hasOcrImage && (
        <details className="rounded-xl border border-[#d9e5e4] bg-[#eaf6f5] p-3">
          <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold text-[#004135]">
            Xem bản đã che gửi tự động nhận diện
          </summary>
          <p className="mb-3 text-xs text-[#404945]">
            Đây đúng là bản ảnh đã được gửi đi để tự động nhận diện. Phần bị che không rời khỏi kho của gia
            đình.
          </p>
          <img
            src={documentImageUrl(documentId, 'ocr')}
            alt="Bản đã che gửi tự động nhận diện"
            loading="lazy"
            className={imageClass}
          />
        </details>
      )}
    </div>
  );
}
