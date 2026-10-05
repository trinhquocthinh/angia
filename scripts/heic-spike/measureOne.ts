import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import type { Measurement } from './parseMeasurement.js';
import { PIPELINES } from './pipelines.js';

// Tiến trình con của runHeicSpike: đo đúng một (pipeline, ảnh) để RSS đỉnh không lẫn giữa các lượt.
// Cách dùng: `tsx scripts/heic-spike/measureOne.ts <pipeline> <đường-dẫn-ảnh>`; in một dòng JSON.
const maxRssMb = (): number => process.resourceUsage().maxRSS / 1024;

const measure = async (pipelineName: string, imagePath: string): Promise<Measurement> => {
  const convert = PIPELINES[pipelineName];
  if (!convert) throw new Error(`Không có pipeline "${pipelineName}"`);
  const input = await readFile(imagePath);

  // Tính cả lần khởi tạo WASM đầu tiên vì worker gặp đúng chi phí này ở job đầu sau khi khởi động.
  const startedAt = performance.now();
  try {
    const converted = await convert(input);
    return { ok: true, durationMs: performance.now() - startedAt, maxRssMb: maxRssMb(), ...converted };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, durationMs: performance.now() - startedAt, maxRssMb: maxRssMb(), error: message };
  }
};

const [pipelineName = '', imagePath = ''] = process.argv.slice(2);
console.log(JSON.stringify(await measure(pipelineName, imagePath)));
