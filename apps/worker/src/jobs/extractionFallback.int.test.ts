import { createHash } from 'node:crypto';
import { pino } from 'pino';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { ExtractionDependencies } from '@src/features/extraction/application/ports.js';
import { createExtractionRepository } from '@src/features/extraction/infrastructure/createExtractionRepository.js';
import { createFallbackExtractor } from '@src/features/extraction/infrastructure/createFallbackExtractor.js';
import { createOpenRouterExtractor } from '@src/features/extraction/infrastructure/createOpenRouterExtractor.js';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { APPROVED_OCR_BYTES, seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { handleExtractDocumentJob } from './handleExtractDocumentJob.js';

const logger = pino({ level: 'silent' });
const PRIMARY = 'google/gemini-3.1-flash-lite';
const FALLBACK = 'moonshotai/kimi-k2.6';
const READING = {
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
      choices: [{ message: { content: JSON.stringify(READING) } }],
      usage: { prompt_tokens: 1200, completion_tokens: 80, cost: 0.0035 },
    }),
  );

// fetch OpenRouter giả lập theo model trong body: mỗi model trả về phản hồi đã cấu hình.
function openRouter(byModel: Record<string, () => Response | Promise<Response>>) {
  const fetchFn = vi.fn<typeof fetch>(async (_url, init) => {
    const reply = byModel[JSON.parse(String(init?.body)).model];
    if (!reply) throw new Error('model lạ');
    return reply();
  });
  const adapter = (model: string) =>
    createOpenRouterExtractor(
      { baseUrl: 'https://openrouter.test/api/v1', apiKey: 'sk-or-test', model },
      fetchFn,
    );
  return { extractor: createFallbackExtractor(adapter(PRIMARY), adapter(FALLBACK)), fetchFn };
}

describe('Model dự phòng trên PostgreSQL thật (E3-S6-T2, SPEC-009, BR-016)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  const deps = (extractor: ExtractionDependencies['extractor']): ExtractionDependencies => ({
    repository: createExtractionRepository(fx.pool),
    budget: { estimatedCostUsd: 0.02, defaultMonthlyCapUsd: 5, now: () => new Date('2026-10-15T03:00:00Z') },
    storage: { get: async () => APPROVED_OCR_BYTES },
    images: { heicToJpeg: async (bytes) => bytes },
    extractor,
    ocrImages: {
      get: async () => ({
        bytes: APPROVED_OCR_BYTES,
        mimeType: 'image/jpeg',
        sha256: createHash('sha256').update(APPROVED_OCR_BYTES).digest('hex'),
      }),
    },
  });
  const run = (extractor: ExtractionDependencies['extractor'], data: object, retryCount: number) =>
    handleExtractDocumentJob(deps(extractor), logger)({ id: 'j', data, retryCount, retryLimit: 2 });
  const state = async (documentId: string) =>
    (
      await fx.owner.query(
        `SELECT d.status, d.original_key, d.ocr_image_key IS NOT NULL AS has_ocr_image, count(e.id)::int AS extractions,
           max(e.provider) AS provider, max(e.model) AS model, max(e.cost_usd) AS cost
         FROM source_documents d LEFT JOIN extractions e ON e.source_document_id = d.id
         WHERE d.id = $1 GROUP BY d.id, d.original_key`,
        [documentId],
      )
    ).rows[0];

  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });

  it('TC-086: Gemini lỗi 500, Kimi trả JSON hợp lệ → pending_review, Extraction ghi model Kimi', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    const ai = openRouter({
      [PRIMARY]: () => new Response('upstream', { status: 500 }),
      [FALLBACK]: completion,
    });
    expect(await run(ai.extractor, doc, 0)).toMatchObject({ status: 'pending_review', costUsd: 0.0035 });
    expect(await state(doc.documentId)).toMatchObject({
      status: 'pending_review',
      extractions: 1,
      provider: 'openrouter',
      model: FALLBACK,
    });
    expect(ai.fetchFn).toHaveBeenCalledTimes(2);
  });

  it('TC-087: cả hai model lỗi mạng ở lượt cuối → manual_entry, giữ ảnh gốc, không tạo Extraction', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    const down = () => Promise.reject(new TypeError('fetch failed'));
    const ai = openRouter({ [PRIMARY]: down, [FALLBACK]: down });
    await expect(run(ai.extractor, doc, 0)).rejects.toThrow('fetch failed');
    expect(await state(doc.documentId)).toMatchObject({ status: 'extracting', extractions: 0 });
    expect(await run(ai.extractor, doc, 2)).toMatchObject({
      status: 'manual_entry',
      reason: 'extractor_failed',
    });
    expect(await state(doc.documentId)).toMatchObject({
      status: 'manual_entry',
      original_key: expect.stringMatching(/original\.jpg$/),
      has_ocr_image: true,
      extractions: 0,
    });
    expect(ai.fetchFn).toHaveBeenCalledTimes(4);
  });
});
