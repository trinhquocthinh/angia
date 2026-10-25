import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, totalmem } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { loadHeicSet } from './loadHeicSet.js';
import { parseMeasurement } from './parseMeasurement.js';
import type { Measurement } from './parseMeasurement.js';
import { PIPELINES } from './pipelines.js';
import { renderSpikeReport } from './renderSpikeReport.js';
import type { CaseMeasurement } from './summarizePipeline.js';
import { summarizePipeline } from './summarizePipeline.js';

// E1-S1-T2: đo thời gian và RSS đỉnh khi chuyển HEIC thật → WebP qua từng pipeline (Tech Spec R4).
// Cách dùng: `yarn heic:spike [thư-mục-ảnh]` (mặc định fixtures/heic).
const run = promisify(execFile);
const measureOnePath = fileURLToPath(new URL('./measureOne.ts', import.meta.url));

// Giữ nguyên loader tsx của tiến trình cha (process.execArgv) để tiến trình con chạy được tệp .ts.
const measureInChild = async (pipeline: string, imagePath: string): Promise<Measurement> => {
  try {
    const { stdout } = await run(
      process.execPath,
      [...process.execArgv, measureOnePath, pipeline, imagePath],
      {
        maxBuffer: 1024 * 1024,
      },
    );
    return parseMeasurement(stdout);
  } catch (error) {
    // Tiến trình con chết giữa chừng (ví dụ bị hệ điều hành giết vì hết RAM) vẫn được ghi là một lượt lỗi.
    return {
      ok: false,
      durationMs: 0,
      maxRssMb: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const main = async (): Promise<void> => {
  const dir = process.argv[2] ?? 'fixtures/heic';
  const cases = await loadHeicSet(dir);
  const pipelines = Object.keys(PIPELINES);
  console.log(`Nạp ${cases.length} ảnh HEIC từ ${dir}; pipeline: ${pipelines.join(', ')}.`);

  const measurements: CaseMeasurement[] = [];
  // Tuần tự, đúng như worker chạy `convert-heic` với concurrency = 1.
  for (const heic of cases) {
    for (const pipeline of pipelines) {
      const result = await measureInChild(pipeline, heic.path);
      const detail = result.ok ? `${Math.round(result.durationMs)} ms` : `lỗi: ${result.error}`;
      console.log(
        `${heic.caseId} (${Math.round(heic.bytes / 1024)} KB) · ${pipeline}: ${detail}, RSS ${Math.round(result.maxRssMb)} MB`,
      );
      measurements.push({ caseId: heic.caseId, pipeline, result });
    }
  }

  const generatedAt = new Date().toISOString();
  const report = renderSpikeReport({
    generatedAt,
    environment: {
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
      cpu: cpus()[0]?.model ?? 'không rõ',
      totalMemGb: Math.round(totalmem() / 1024 ** 3),
    },
    summaries: pipelines.map((pipeline) => summarizePipeline(pipeline, measurements)),
    measurements,
  });

  const reportDir = join(dir, 'reports');
  await mkdir(reportDir, { recursive: true });
  const reportPath = join(reportDir, `${generatedAt.replace(/[:.]/g, '-')}.md`);
  await writeFile(reportPath, report);
  console.log(`\n${report}\nĐã ghi báo cáo: ${reportPath}`);
};

await main();
