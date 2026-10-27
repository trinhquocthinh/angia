import { seedOcrGate } from '@src/shared/test/seedOcrGate.js';
import { createHash } from 'node:crypto';
import { pino } from 'pino';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_AI_ROUTING_SETTINGS, type AiRoutingSettings } from '@angia/contracts';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { APPROVED_OCR_BYTES, seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { createExtractionRepository } from '@src/features/extraction/infrastructure/createExtractionRepository.js';
import { createFakeExtractor } from '@src/features/extraction/infrastructure/createFakeExtractor.js';
import { createAiRoutingReader } from '@src/features/aiRouting/infrastructure/createAiRoutingReader.js';
import { createExtractionAttempts } from '@src/features/aiRouting/infrastructure/createExtractionAttempts.js';
import { handleExtractDocumentJob } from './handleExtractDocumentJob.js';

describe('SPEC-041: định tuyến trên PostgreSQL bằng role app NOBYPASSRLS', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  const logger = pino({ level: 'silent' });
  const runtime = {
    runMode: 'live' as const,
    openRouterBaseUrl: 'https://openrouter.test/api/v1',
    openRouterApiKey: 'synthetic-key',
    observeCharge: async () => {},
  };
  const job = (data: object) => ({ id: 'synthetic-job', data, retryCount: 0, retryLimit: 2 });
  const dependencies = () => ({
    repository: createExtractionRepository(fx.pool, () => new Date('2026-10-15T03:00:00Z')),
    budget: {
      estimatedCostUsd: 0.02,
      defaultMonthlyCapUsd: 5,
      defaultFamilyCapUsd: 0.5,
      now: () => new Date('2026-10-15T03:00:00Z'),
    },
    storage: { get: async () => APPROVED_OCR_BYTES },
    images: { heicToJpeg: async (bytes: Uint8Array) => bytes },
    extractor: createFakeExtractor(),
    ocrImages: {
      get: async () => ({
        bytes: APPROVED_OCR_BYTES,
        mimeType: 'image/jpeg',
        sha256: createHash('sha256').update(APPROVED_OCR_BYTES).digest('hex'),
      }),
    },
  });
  const saveConfig = async (settings: AiRoutingSettings, version: number) => {
    await fx.owner.query(
      `UPDATE ai_routing_settings SET settings=$1::jsonb, version=$2,
      updated_at=now(), updated_by=(SELECT id FROM accounts LIMIT 1) WHERE id=1`,
      [JSON.stringify(settings), version],
    );
  };
  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  beforeEach(async () => {
    await fx.owner.query(
      `UPDATE ai_routing_settings SET version=0, settings=$1::jsonb,
      updated_at=NULL, updated_by=NULL WHERE id=1`,
      [JSON.stringify(DEFAULT_AI_ROUTING_SETTINGS)],
    );
  });

  it('TC-525: role app đọc bootstrap; không dùng role owner/BYPASSRLS cho reader', async () => {
    const role = await fx.pool.query('SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user');
    expect(role.rows[0].rolbypassrls).toBe(false);
    expect(await createAiRoutingReader(fx.pool).read()).toMatchObject({
      version: 0,
      settings: DEFAULT_AI_ROUTING_SETTINGS,
    });
  });

  it('TC-533: đổi Woku → OpenRouter giữa hai lượt; không giữ chỗ ở lượt bị chặn, phí ghi đúng', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await seedOcrGate(fx.owner, doc.familyId, new Date('2026-10-15T03:00:00Z'));
    const deps = dependencies();
    const attempts = createExtractionAttempts(
      deps,
      createAiRoutingReader(fx.pool),
      runtime,
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    type: 'prescription',
                    issuedDate: '2026-10-01',
                    facility: null,
                    diagnosis: null,
                    items: [
                      {
                        name: 'Thuốc tổng hợp',
                        strength: null,
                        quantityPerDose: 1,
                        doseUnit: 'viên',
                        slots: ['morning'],
                        durationDays: 3,
                        longTerm: false,
                        note: null,
                        totalQuantity: 3,
                      },
                    ],
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 10, completion_tokens: 1, cost: 0.0035 },
          }),
        ),
    );
    const run = handleExtractDocumentJob(deps, logger, attempts);
    await expect(run(job(doc))).rejects.toThrow('woku_live_unavailable');
    expect((await fx.owner.query('SELECT count(*)::int AS n FROM extraction_reservations')).rows[0].n).toBe(
      0,
    );
    const settings = structuredClone(DEFAULT_AI_ROUTING_SETTINGS) as AiRoutingSettings;
    settings.selectedProvider = 'openrouter';
    await saveConfig(settings, 1);
    expect(await run(job(doc))).toMatchObject({ status: 'pending_review', costUsd: 0.0035 });
    expect(
      (
        await fx.owner.query(
          'SELECT provider, model, cost_usd FROM extractions WHERE source_document_id=$1',
          [doc.documentId],
        )
      ).rows[0],
    ).toMatchObject({ provider: 'openrouter', model: 'google/gemini-3.1-flash-lite', cost_usd: '0.0035' });
    expect(
      (await fx.owner.query('SELECT spent_usd FROM extraction_spend WHERE month=$1', ['2026-10'])).rows[0]
        .spent_usd,
    ).toBe('0.000000');
  });

  it('TC-534: sai gia đình không đọc ảnh/call AI/ghi trích xuất dù đã đọc cấu hình toàn cục', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    const other = await seedExtractingDocument(fx.owner);
    const settings = structuredClone(DEFAULT_AI_ROUTING_SETTINGS) as AiRoutingSettings;
    settings.selectedProvider = 'openrouter';
    await saveConfig(settings, 1);
    let calls = 0;
    await seedOcrGate(fx.owner, doc.familyId, new Date('2026-10-15T03:00:00Z'));
    const deps = dependencies();
    const attempts = createExtractionAttempts(deps, createAiRoutingReader(fx.pool), runtime, async () => {
      calls++;
      throw new Error('Không được gọi');
    });
    expect(
      await handleExtractDocumentJob(deps, logger, attempts)(job({ ...doc, familyId: other.familyId })),
    ).toEqual({ status: 'skipped' });
    expect(calls).toBe(0);
    expect(
      (
        await fx.owner.query('SELECT count(*)::int AS n FROM extractions WHERE source_document_id=$1', [
          doc.documentId,
        ])
      ).rows[0].n,
    ).toBe(0);
  });
});
