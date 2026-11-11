import { z } from 'zod';
import type { OcrMaskAnalyzer, OcrMaskBox } from '../application/redactionSuggestionPorts.js';

const unit = z.number().min(0).max(1);
// Chỉ khai trường cần dùng; text/conf/reason bị zod bỏ, không đi tiếp vào log hay phản hồi (BR-085).
const analyzeResponseSchema = z.object({
  regions: z.array(z.object({ bbox: z.tuple([unit, unit, unit, unit]), mask: z.boolean() })),
});

// SPEC-083: một lời gọi trong mạng internal ocr-<env>, timeout 60 s, huỷ theo request của client.
export function createOcrMaskAnalyzer(baseUrl: string, options = { timeoutMs: 60_000 }): OcrMaskAnalyzer {
  return {
    async analyze(jpeg, signal) {
      const form = new FormData();
      form.append('image', new Blob([jpeg], { type: 'image/jpeg' }), 'image.jpg');
      const response = await fetch(new URL('/v1/analyze', baseUrl), {
        method: 'POST',
        body: form,
        signal: AbortSignal.any([signal, AbortSignal.timeout(options.timeoutMs)]),
      });
      if (!response.ok) {
        // Không đọc body lỗi: có thể chứa dữ liệu ảnh/OCR.
        await response.body?.cancel().catch(() => undefined);
        throw new Error(`ocr-mask HTTP ${response.status}`);
      }
      const parsed = analyzeResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error('ocr-mask trả phản hồi sai schema');
      return parsed.data.regions.filter((region) => region.mask).map((region): OcrMaskBox => region.bbox);
    },
  };
}
