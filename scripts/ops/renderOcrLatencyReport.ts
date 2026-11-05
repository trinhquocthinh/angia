import { MEDIAN_LIMIT_MS, REQUIRED_DOCUMENTS, type OcrLatencyVerdict } from './assessOcrLatency.js';
import type { DurationSummary } from './summarizeDurations.js';
import type { OcrLatencySample } from './toOcrLatencySamples.js';

interface ReportInput {
  generatedAt: string;
  since: string;
  verdict: OcrLatencyVerdict;
  sanitization: DurationSummary;
  samples: readonly OcrLatencySample[];
}

const seconds = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`);
const summaryRow = (label: string, summary: DurationSummary) =>
  `| ${label} | ${summary.count} | ${seconds(summary.medianMs)} | ${seconds(summary.p90Ms)} | ` +
  `${seconds(summary.minMs)} | ${seconds(summary.maxMs)} |`;

// Báo cáo Markdown để dán vào hồ sơ nghiệm thu, không có dữ liệu sức khỏe. Mã chứng từ rút gọn còn 8 ký tự
// cuối: UUIDv7 mở đầu bằng mốc thời gian nên 8 ký tự đầu của các chứng từ tải cùng lúc trùng nhau.
export function renderOcrLatencyReport(input: ReportInput): string {
  const { verdict } = input;
  const outcomes = Object.entries(verdict.outcomes)
    .map(([outcome, count]) => `${outcome}: ${count}`)
    .join(', ');
  return [
    '# NFR-3 — Thời gian đáp ứng trích xuất OCR (TC-095)',
    '',
    `Sinh lúc ${input.generatedAt}; job tạo từ ${input.since}.`,
    'Khoảng đo: từ `created_on` của job `sanitize-document-image` (lúc tải lên) tới',
    '`completed_on` của job `extract-document` đầu tiên — gồm làm sạch, chờ hàng đợi, gọi AI,',
    'model dự phòng và thử lại. Không gồm thời gian người dùng che định danh trên máy.',
    'Chỉ tính mẫu có đủ hai job; OCR thiếu job làm sạch không vào tập đo.',
    '',
    `Kết luận: ${verdict.passed ? '**ĐẠT**' : '**KHÔNG ĐẠT**'} (trung vị ≤ ${seconds(MEDIAN_LIMIT_MS)} ` +
      `trên ≥ ${REQUIRED_DOCUMENTS} chứng từ có bản trích xuất)`,
    ...verdict.reasons.map((reason) => `- ${reason}`),
    '',
    '| Tập | Số mẫu | Trung vị | p90 | Nhỏ nhất | Lớn nhất |',
    '| :-- | --: | --: | --: | --: | --: |',
    summaryRow('Có bản trích xuất (pending_review)', verdict.withExtraction),
    summaryRow('Mọi chứng từ có OCR và đủ mốc đo', verdict.all),
    summaryRow('Thời gian làm sạch (sanitize-document-image)', input.sanitization),
    '',
    `Phân bố outcome: ${outcomes || '—'}`,
    '',
    '| Chứng từ | Outcome | Thử lại OCR | Chờ hàng đợi OCR | Tổng |',
    '| :-- | :-- | --: | --: | --: |',
    ...input.samples.map(
      (sample) =>
        `| ${sample.documentId.slice(-8)} | ${sample.outcome} | ${sample.retryCount} | ` +
        `${seconds(sample.queueWaitMs)} | ${seconds(sample.durationMs)} |`,
    ),
    '',
  ].join('\n');
}
