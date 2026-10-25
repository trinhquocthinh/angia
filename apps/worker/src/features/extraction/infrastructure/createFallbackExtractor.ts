import type { DocumentExtractor } from '../application/ports.js';

/**
 * Model chính → dự phòng trong cùng một lượt thử (Tech Spec §1, chủ dự án chốt 2026-10-10): chỉ lỗi
 * mạng/HTTP/timeout của model chính mới chuyển sang dự phòng; phản hồi sai định dạng giữ nguyên để
 * không tốn thêm một lời gọi. Cả hai lỗi thì ném lỗi dự phòng cho pg-boss thử lại (BR-016).
 * Cả hai lời gọi dùng chung chỗ giữ ngân sách của lượt thử; lỗi mạng không có `usage.cost`.
 */
export function createFallbackExtractor(
  primary: DocumentExtractor,
  fallback: DocumentExtractor,
): DocumentExtractor {
  return {
    extract: async (image) => {
      try {
        return await primary.extract(image);
      } catch {
        return fallback.extract(image);
      }
    },
  };
}
