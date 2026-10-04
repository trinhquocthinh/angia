import type { CaseResult, ModelSummary } from './summarizeModel.js';

export interface ReportInput {
  generatedAt: string;
  summaries: ModelSummary[];
  results: CaseResult[];
}

const percent = (ratio: number): string => `${(ratio * 100).toFixed(1)}%`;
const usd = (value: number): string => `$${value.toFixed(6)}`;

const summaryRow = (summary: ModelSummary): string =>
  [
    summary.model,
    summary.cases,
    summary.failedCases,
    `${summary.correctFields}/${summary.totalFields}`,
    percent(summary.accuracy),
    summary.meetsThreshold ? '✅ Đạt' : '❌ Dưới 70%',
    usd(summary.totalCostUsd),
    usd(summary.avgCostPerImageUsd),
    `${Math.round(summary.avgLatencyMs)} ms`,
  ].join(' | ');

const caseRow = (result: CaseResult): string => {
  const detail = result.failure ?? (result.score.mismatches.join(', ') || '—');
  return [
    result.caseId,
    result.model,
    `${result.score.correct}/${result.score.total}`,
    detail,
    usd(result.costUsd),
  ].join(' | ');
};

/** Bảng số liệu E1-S1-T1 để dán vào hồ sơ nghiệm thu Epic 1. Không chứa nội dung chứng từ, chỉ đường dẫn trường. */
export const renderReport = ({ generatedAt, summaries, results }: ReportInput): string =>
  [
    `# Kiểm chuẩn Vision-LLM — bộ ảnh chuẩn (${generatedAt})`,
    '',
    '## Tổng hợp',
    '',
    '| Model | Số ảnh | Ảnh lỗi | Trường đúng | Tỷ lệ | Ngưỡng R1 | Tổng chi phí | Chi phí/ảnh | Độ trễ TB |',
    '| --- | :---: | :---: | :---: | :---: | :---: | ---: | ---: | ---: |',
    ...summaries.map((summary) => `| ${summaryRow(summary)} |`),
    '',
    '## Chi tiết từng ảnh',
    '',
    '| Ảnh | Model | Trường đúng | Trường sai / lỗi | Chi phí |',
    '| --- | --- | :---: | --- | ---: |',
    ...results.map((result) => `| ${caseRow(result)} |`),
    '',
  ].join('\n');
