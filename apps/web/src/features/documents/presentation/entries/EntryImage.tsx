import { documentImageUrl } from '../../infrastructure/createReviewRepository';

// Server chỉ giữ một ảnh đã che cho mỗi chứng từ (BR-012); ảnh có thể đã bị xóa khi dọn luồng cũ.
export function EntryImage({ documentId, hasImage }: { documentId: string; hasImage: boolean }) {
  if (!hasImage)
    return (
      <p className="rounded-xl border border-[#d9e5e4] bg-[#f0fcfb] p-4 text-sm text-[#404945]">
        Ảnh đã được xóa để bảo vệ riêng tư
      </p>
    );
  return (
    <figure className="flex flex-col gap-2">
      <img
        src={documentImageUrl(documentId)}
        alt="Ảnh giấy tờ đã che"
        className="w-full rounded-xl border border-[#d9e5e4] bg-[#f0fcfb] object-contain"
      />
      <figcaption className="text-xs text-[#404945]">
        Đây là bản đã che. AN GIA không lưu ảnh chưa che.
      </figcaption>
    </figure>
  );
}
