import type { CaseMeasurement, PipelineSummary } from './summarizePipeline.js';

interface SpikeEnvironment {
  node: string;
  platform: string;
  cpu: string;
  totalMemGb: number;
}

export interface SpikeReportInput {
  generatedAt: string;
  environment: SpikeEnvironment;
  summaries: PipelineSummary[];
  measurements: CaseMeasurement[];
}

const seconds = (ms: number | null): string => (ms === null ? '—' : `${(ms / 1000).toFixed(1)} s`);
const megabytes = (mb: number): string => `${Math.round(mb)} MB`;
// Lỗi của libvips/libheif thường nhiều dòng; gộp lại để không vỡ hàng bảng markdown.
const cell = (text: string): string =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' / ')
    .replaceAll('|', '\\|');

const summaryRow = (summary: PipelineSummary): string =>
  [
    summary.pipeline,
    `${summary.succeeded}/${summary.cases}`,
    seconds(summary.avgDurationMs),
    seconds(summary.maxDurationMs),
    megabytes(summary.maxRssMb),
    summary.meetsThreshold ? '✅ Đạt' : '❌ Không đạt',
  ].join(' | ');

const caseRow = ({ caseId, pipeline, result }: CaseMeasurement): string =>
  (result.ok
    ? [
        caseId,
        pipeline,
        `${result.width}×${result.height}`,
        seconds(result.durationMs),
        megabytes(result.maxRssMb),
        `${Math.round(result.outputBytes / 1024)} KB`,
      ]
    : [caseId, pipeline, '—', `lỗi: ${cell(result.error)}`, megabytes(result.maxRssMb), '—']
  ).join(' | ');

/** Bảng số liệu E1-S1-T2 để dán vào hồ sơ nghiệm thu Epic 1. */
export const renderSpikeReport = ({
  generatedAt,
  environment,
  summaries,
  measurements,
}: SpikeReportInput): string =>
  [
    `# Spike giải mã HEIC → WebP (${generatedAt})`,
    '',
    `Môi trường: Node ${environment.node} · ${environment.platform} · ${environment.cpu} · ${environment.totalMemGb} GB RAM.`,
    'Mỗi lượt đo chạy trong một tiến trình con riêng; RAM là RSS đỉnh của cả tiến trình (gồm khởi tạo WASM).',
    'Ngưỡng R4 (Tech Spec): ≤ 30 s/ảnh và RSS đỉnh < 512 MB (`mem_limit` của angia-worker).',
    '',
    '## Tổng hợp',
    '',
    '| Pipeline | Thành công | Thời gian TB | Thời gian max | RSS đỉnh | Ngưỡng R4 |',
    '| --- | :---: | ---: | ---: | ---: | :---: |',
    ...summaries.map((summary) => `| ${summaryRow(summary)} |`),
    '',
    '## Chi tiết từng ảnh',
    '',
    '| Ảnh | Pipeline | Kích thước | Thời gian | RSS đỉnh | WebP |',
    '| --- | --- | :---: | ---: | ---: | ---: |',
    ...measurements.map((measurement) => `| ${caseRow(measurement)} |`),
    '',
  ].join('\n');
