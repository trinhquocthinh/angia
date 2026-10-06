import { z } from 'zod';

// Hàng đợi pg-boss do API đẩy (cùng transaction tạo chứng từ) và worker xử lý (SPEC-009).
export const EXTRACT_DOCUMENT_QUEUE = 'extract-document';

// API và worker cùng createQueue lúc khởi động (idempotent) để bên nào lên trước cũng gửi/nhận được.
// Lỗi gọi AI thử lại 2 lần, giãn cách 30 s tăng dần (chủ dự án chốt 2026-10-06); hết lượt → manual_entry.
// createQueue không ghi đè queue đã có: đổi tùy chọn sau này phải dùng updateQueue.
export const EXTRACT_DOCUMENT_QUEUE_OPTIONS = {
  retryLimit: 2,
  retryDelay: 30,
  retryBackoff: true,
  expireInSeconds: 300,
} as const;

// familyId lấy từ phiên của người tải để worker mở withFamilyScope; không gửi sang dịch vụ AI.
export const extractDocumentJobSchema = z.object({
  documentId: z.uuid(),
  familyId: z.uuid(),
});
export type ExtractDocumentJob = z.infer<typeof extractDocumentJobSchema>;
