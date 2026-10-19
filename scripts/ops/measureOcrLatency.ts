import { parseArgs } from 'node:util';
import { assessOcrLatency } from './assessOcrLatency.js';
import { readJobRows } from './readJobRows.js';
import { renderOcrLatencyReport } from './renderOcrLatencyReport.js';
import { summarizeDurations } from './summarizeDurations.js';
import { toOcrLatencySamples } from './toOcrLatencySamples.js';

// E7-S1-T2/TC-095: đo NFR-3 trên SIT từ bảng job pg-boss (pg-boss xóa job đã xong sau 7 ngày).
// Cách dùng: `yarn ops:ocr-latency [--since 2026-10-19T00:00:00Z]`, kết nối qua OCR_LATENCY_DATABASE_URL
// (role app của môi trường; script đặt phiên chỉ đọc). Mã thoát 1 khi chưa đạt.
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const main = async (): Promise<number> => {
  const connectionString = process.env.OCR_LATENCY_DATABASE_URL;
  if (!connectionString) {
    console.error('Thiếu OCR_LATENCY_DATABASE_URL');
    return 2;
  }
  const { values } = parseArgs({ options: { since: { type: 'string' } } });
  const since = values.since ? new Date(values.since) : new Date(Date.now() - SEVEN_DAYS_MS);
  if (Number.isNaN(since.getTime())) {
    console.error(`--since không hợp lệ: ${values.since}`);
    return 2;
  }
  const { extraction, preparation } = toOcrLatencySamples(await readJobRows(connectionString, since));
  const verdict = assessOcrLatency(extraction);
  console.log(
    renderOcrLatencyReport({
      generatedAt: new Date().toISOString(),
      since: since.toISOString(),
      verdict,
      preparation: summarizeDurations(preparation),
      samples: extraction,
    }),
  );
  return verdict.passed ? 0 : 1;
};

process.exitCode = await main();
