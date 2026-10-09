import { z } from 'zod';

// Hàng đợi pg-boss do API đẩy (cùng transaction tạo chứng từ) và worker xử lý (SPEC-009).
export const EXTRACT_DOCUMENT_QUEUE = 'extract-document';

// Job hết lượt/quá hạn (worker chết giữa lần thử cuối) được pg-boss chép sang đây để chứng từ không kẹt
// `extracting` (nợ #20, F08a, E3-S6-T1). Phải tạo trước queue chính vì cột dead_letter có FK tới queue.
export const EXTRACT_DOCUMENT_DEAD_LETTER_QUEUE = 'extract-document-dead';
const EXTRACT_DOCUMENT_DEAD_LETTER_QUEUE_OPTIONS = {
  retryLimit: 5,
  retryDelay: 30,
  retryBackoff: true,
} as const;

// API và worker cùng createQueue lúc khởi động (idempotent) để bên nào lên trước cũng gửi/nhận được.
// Lỗi gọi AI thử lại 2 lần, giãn cách 30 s tăng dần (chủ dự án chốt 2026-10-06); hết lượt → manual_entry.
// createQueue không ghi đè queue đã có: đổi tùy chọn sau này phải dùng updateQueue.
const EXTRACT_DOCUMENT_QUEUE_OPTIONS = {
  retryLimit: 2,
  retryDelay: 30,
  retryBackoff: true,
  expireInSeconds: 300,
  deadLetter: EXTRACT_DOCUMENT_DEAD_LETTER_QUEUE,
} as const;

// familyId lấy từ phiên của người tải để worker mở withFamilyScope; không gửi sang dịch vụ AI.
export const extractDocumentJobSchema = z.object({
  documentId: z.uuid(),
  familyId: z.uuid(),
});
export type ExtractDocumentJob = z.infer<typeof extractDocumentJobSchema>;

interface QueueAdmin {
  createQueue(name: string, options: object): Promise<void>;
  updateQueue(name: string, options: object): Promise<void>;
}

// Thứ tự bắt buộc: dead-letter trước (FK), rồi queue chính; updateQueue để queue tạo trước E3-S6-T1 nhận deadLetter.
export async function ensureExtractDocumentQueues(boss: QueueAdmin): Promise<void> {
  await boss.createQueue(EXTRACT_DOCUMENT_DEAD_LETTER_QUEUE, EXTRACT_DOCUMENT_DEAD_LETTER_QUEUE_OPTIONS);
  await boss.createQueue(EXTRACT_DOCUMENT_QUEUE, EXTRACT_DOCUMENT_QUEUE_OPTIONS);
  await boss.updateQueue(EXTRACT_DOCUMENT_QUEUE, EXTRACT_DOCUMENT_QUEUE_OPTIONS);
}
