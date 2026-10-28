import { pino } from 'pino';
import { describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS, type AiRoutingView } from '@angia/contracts';
import { createMemoryExtractionDeps } from '@src/shared/test/createMemoryExtractionDeps.js';
import { createExtractionAttempts } from '@src/features/aiRouting/infrastructure/createExtractionAttempts.js';
import { handleExtractDocumentJob } from './handleExtractDocumentJob.js';

const data = {
  documentId: '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5b',
  familyId: '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5c',
};
const job = { id: 'synthetic-job', data, retryCount: 0, retryLimit: 2 };
const config = (): AiRoutingView => ({
  version: 1,
  settings: structuredClone(DEFAULT_AI_ROUTING_SETTINGS),
  updatedAt: null,
  updatedBy: null,
});
const runtime = {
  runMode: 'live' as const,
  openRouterBaseUrl: 'https://openrouter.test/api/v1',
  openRouterApiKey: 'synthetic-key',
  observeCharge: async () => {},
};
const memory = () => createMemoryExtractionDeps({ ...data, result: { ok: false, reason: 'invalid_json' } });
const logger = pino({ level: 'silent' });
const content = {
  type: 'device_reading',
  measuredAt: '2026-10-01',
  measuredTime: '07:00',
  kind: 'blood_pressure',
  systolic: 130,
  diastolic: 80,
  pulse: 72,
  glucoseValue: null,
  glucoseUnit: null,
};
const completion = () =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
      usage: { prompt_tokens: 10, completion_tokens: 1, cost: 0.0035 },
    }),
  );

describe('SPEC-041: job dùng snapshot động', () => {
  it('TC-527: OpenRouter thiếu key bị chặn trước đọc ảnh/giữ ngân sách kể cả ở lượt cuối', async () => {
    const fixture = memory();
    const attempts = createExtractionAttempts(
      fixture.deps,
      { read: async () => config() },
      { ...runtime, openRouterApiKey: ' ' },
    );
    await expect(
      handleExtractDocumentJob(fixture.deps, logger, attempts)({ ...job, retryCount: 2 }),
    ).rejects.toMatchObject({ code: 'openrouter_key_missing' });
    expect(fixture.statusHistory).toEqual([]);
    expect(fixture.extractorCalls).toEqual([]);
    expect(fixture.ledger.spentUsd()).toBe(0);
  });

  it('TC-528: OpenRouter chính lỗi 500 dùng model dự phòng trong cùng snapshot và ghi phí cũ', async () => {
    const fixture = memory();
    const settings = config();
    const models: string[] = [];
    const attempts = createExtractionAttempts(
      fixture.deps,
      { read: async () => settings },
      runtime,
      async (_url, init) => {
        models.push(JSON.parse(String(init?.body)).model);
        return models.length === 1 ? new Response('', { status: 500 }) : completion();
      },
    );
    expect(await handleExtractDocumentJob(fixture.deps, logger, attempts)(job)).toEqual({
      status: 'pending_review',
      costUsd: 0.0035,
    });
    expect(models).toEqual(['google/gemini-3.1-flash-lite', 'moonshotai/kimi-k2.6']);
    expect(fixture.extractions[0]).toMatchObject({
      provider: 'openrouter',
      model: 'moonshotai/kimi-k2.6',
      costUsd: 0.0035,
    });
  });

  it('TC-530: payload sai bị từ chối trước đọc cấu hình DB', async () => {
    const fixture = memory();
    let reads = 0;
    const attempts = createExtractionAttempts(
      fixture.deps,
      {
        read: async () => {
          reads++;
          return config();
        },
      },
      runtime,
    );
    await expect(
      handleExtractDocumentJob(fixture.deps, logger, attempts)({ ...job, data: {} }),
    ).rejects.toThrow();
    expect(reads).toBe(0);
  });

  it('TC-524: log phân loại lỗi cấu hình bằng mã cố định', async () => {
    const fixture = memory();
    const lines: string[] = [];
    const log = pino({}, { write: (line: string) => lines.push(line) });
    const attempts = createExtractionAttempts(
      fixture.deps,
      { read: async () => config() },
      { ...runtime, openRouterApiKey: ' ' },
    );
    await expect(handleExtractDocumentJob(fixture.deps, log, attempts)(job)).rejects.toThrow(
      'openrouter_key_missing',
    );
    expect(lines.map((line) => JSON.parse(line))).toContainEqual(
      expect.objectContaining({ reason: 'openrouter_key_missing' }),
    );
    expect(lines.join('')).not.toContain('synthetic-key');
  });
});
