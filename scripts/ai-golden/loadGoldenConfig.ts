export interface GoldenConfig {
  baseUrl: string;
  apiKey: string;
  models: string[];
  goldenDir: string;
  disableReasoning: boolean;
}

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Model chính và dự phòng chốt sau benchmark E1-S1-T1 (2026-10-04, Tech Spec §1):
 * Gemini 3.1 Flash-Lite 97.0% và Kimi K2.6 93.6% trên 7 đơn thuốc, cả hai tắt suy luận.
 */
export const DEFAULT_MODELS = ['google/gemini-3.1-flash-lite', 'moonshotai/kimi-k2.6'];

/** Đọc cấu hình: `yarn ai:golden [--models a,b] [--reasoning] [thư-mục-ảnh]`. Mặc định tắt suy luận như vận hành. */
export const loadGoldenConfig = (env: Record<string, string | undefined>, argv: string[]): GoldenConfig => {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Thiếu OPENROUTER_API_KEY trong .env.');

  const disableReasoning = !argv.includes('--reasoning');
  const args = argv.filter((arg) => arg !== '--reasoning');
  const modelsFlag = args.indexOf('--models');
  const modelsArg = modelsFlag === -1 ? undefined : args.splice(modelsFlag, 2)[1];
  const models = modelsArg
    ? modelsArg
        .split(',')
        .map((model) => model.trim())
        .filter(Boolean)
    : DEFAULT_MODELS;

  return {
    baseUrl: env.OPENROUTER_BASE_URL || OPENROUTER_BASE_URL,
    apiKey,
    models,
    goldenDir: args[0] ?? 'fixtures/golden',
    disableReasoning,
  };
};
