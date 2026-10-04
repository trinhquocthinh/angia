import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { callVisionModel } from './callVisionModel.js';
import { EXTRACTION_PROMPT } from './extractionPrompt.js';
import { loadGoldenConfig } from './loadGoldenConfig.js';
import { loadGoldenSet } from './loadGoldenSet.js';
import { renderReport } from './renderReport.js';
import { runCase } from './runCase.js';
import type { CaseResult } from './summarizeModel.js';
import { summarizeModel } from './summarizeModel.js';

// E1-S1-T1: chạy bộ ảnh chuẩn qua từng Vision-LLM trên OpenRouter, chấm theo trường, đo chi phí (R1, A3, SDD §2.1).
// Cách dùng: `yarn ai:golden [--models a,b] [--reasoning] [thư-mục-ảnh]`. Gọi API thật, phát sinh chi phí.
const main = async (): Promise<number> => {
  const config = loadGoldenConfig(process.env, process.argv.slice(2));
  const cases = await loadGoldenSet(config.goldenDir);
  console.log(`Nạp ${cases.length} ảnh chuẩn từ ${config.goldenDir}; model: ${config.models.join(', ')}.`);

  // Nhãn trong báo cáo phân biệt lượt tắt suy luận với lượt mặc định của cùng model.
  const labelOf = (model: string): string => (config.disableReasoning ? `${model} (tắt suy luận)` : model);
  const results: CaseResult[] = [];
  // Chạy tuần tự để tránh giới hạn tần suất và đo độ trễ sạch.
  for (const golden of cases) {
    const imageBase64 = (await readFile(golden.imagePath)).toString('base64');
    for (const model of config.models) {
      const result = await runCase({ ...golden, imageBase64 }, labelOf(model), (image) =>
        callVisionModel({ ...config, model, prompt: EXTRACTION_PROMPT, image }),
      );
      console.log(`${golden.caseId} · ${labelOf(model)}: ${result.score.correct}/${result.score.total}`);
      results.push(result);
    }
  }

  const summaries = config.models.map((model) => summarizeModel(labelOf(model), results));
  const generatedAt = new Date().toISOString();
  const report = renderReport({ generatedAt, summaries, results });

  const reportDir = join(config.goldenDir, 'reports');
  await mkdir(reportDir, { recursive: true });
  const reportPath = join(reportDir, `${generatedAt.replace(/[:.]/g, '-')}.md`);
  await writeFile(reportPath, report);
  // Kết quả thô để đối chiếu trường sai với đáp án; nằm trong thư mục bị gitignore.
  await writeFile(reportPath.replace(/\.md$/, '.raw.json'), JSON.stringify(results, null, 2));
  console.log(`\n${report}\nĐã ghi báo cáo: ${reportPath}`);

  // Mã thoát 1 khi không model nào đạt ngưỡng R1 → dừng UC1 theo Master Plan.
  return summaries.some((summary) => summary.meetsThreshold) ? 0 : 1;
};

process.exitCode = await main();
