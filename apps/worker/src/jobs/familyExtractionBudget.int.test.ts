import { createHash, randomUUID } from 'node:crypto';
import type { ExtractionPayload } from '@angia/contracts';
import { pino } from 'pino';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type {
  DocumentExtractor,
  ExtractionDependencies,
} from '@src/features/extraction/application/ports.js';
import { createExtractionRepository } from '@src/features/extraction/infrastructure/createExtractionRepository.js';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { APPROVED_OCR_BYTES, seedExtractingDocument } from '@src/shared/test/seedExtractingDocument.js';
import { handleExtractDocumentJob } from './handleExtractDocumentJob.js';
import { handleRecoverDeadExtractionJob } from './handleRecoverDeadExtractionJob.js';

const logger = pino({ level: 'silent' });
const NOW = new Date('2026-10-15T03:00:00Z'); // tháng ngân sách 2026-10 giờ Việt Nam
const COST = 0.00113;
const PAYLOAD: ExtractionPayload = {
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

function countingExtractor(options: { delayMs?: number; error?: Error } = {}) {
  const calls: string[] = [];
  const extractor: DocumentExtractor = {
    extract: async () => {
      calls.push('call');
      await new Promise((resolve) => setTimeout(resolve, options.delayMs ?? 0));
      if (options.error) throw options.error;
      return { ok: true, content: PAYLOAD, provider: 'openrouter', model: 'gemini', costUsd: COST };
    },
  };
  return { extractor, calls };
}

describe('Trần chi phí OCR theo gia đình trên PostgreSQL thật (SPEC-031, BR-018)', () => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  const deps = (extractor: DocumentExtractor): ExtractionDependencies => ({
    repository: createExtractionRepository(fx.pool),
    budget: { estimatedCostUsd: 0.02, defaultMonthlyCapUsd: 5, defaultFamilyCapUsd: 0.5, now: () => NOW },
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
  const run = (extractor: DocumentExtractor, data: object, retryCount = 0) =>
    handleExtractDocumentJob(deps(extractor), logger)({ id: 'j', data, retryCount, retryLimit: 2 });
  const setGlobal = (spent: number, cap = 5) =>
    fx.owner.query(`INSERT INTO extraction_spend(month, spent_usd, cap_usd) VALUES ('2026-10', $1, $2)`, [
      spent,
      cap,
    ]);
  const setFamily = (familyId: string, spent: number) =>
    fx.owner.query(
      `INSERT INTO family_extraction_spend(family_id, month, spent_usd) VALUES ($1, '2026-10', $2)`,
      [familyId, spent],
    );
  const familySpent = async (familyId: string) =>
    (
      await fx.owner.query(
        `SELECT spent_usd FROM family_extraction_spend WHERE family_id = $1 AND month = '2026-10'`,
        [familyId],
      )
    ).rows[0]?.spent_usd as string | undefined;
  const globalSpent = async () =>
    (await fx.owner.query(`SELECT spent_usd FROM extraction_spend WHERE month = '2026-10'`)).rows[0]
      ?.spent_usd as string | undefined;

  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => fx?.close());
  beforeEach(async () => {
    await fx.owner.query(
      'DELETE FROM extraction_reservations; DELETE FROM family_extraction_spend; DELETE FROM extraction_spend',
    );
  });

  it('TC-303: gia đình A gần hết trần riêng → A awaiting_budget, không gọi AI; gia đình B vẫn được gọi', async () => {
    const a = await seedExtractingDocument(fx.owner);
    const b = await seedExtractingDocument(fx.owner);
    await setGlobal(0);
    await setFamily(a.familyId, 0.49);
    const ai = countingExtractor();
    expect(await run(ai.extractor, a)).toEqual({ status: 'awaiting_budget' });
    expect(await run(ai.extractor, b)).toMatchObject({ status: 'pending_review' });
    expect(ai.calls).toHaveLength(1);
    expect(await familySpent(a.familyId)).toBe('0.490000');
    expect(await familySpent(b.familyId)).toBe('0.001130');
    expect(await globalSpent()).toBe('0.001130');
  });

  it('TC-304: 6 chứng từ đồng thời của một gia đình, trần riêng đủ 3 chỗ → đúng 3 lời gọi AI', async () => {
    const first = await seedExtractingDocument(fx.owner);
    const docs = [first];
    for (let i = 0; i < 5; i += 1) {
      const id = randomUUID();
      // Bản sao cùng gia đình/hồ sơ/lô, khóa ảnh theo id mới (trigger chặn UPDATE khóa ảnh đã duyệt).
      await fx.owner.query(
        `INSERT INTO source_documents (id, family_id, health_profile_id, batch_id, type, status, original_key, mime_type,
           size_bytes, ocr_image_key, ocr_image_sha256, privacy_approved_by, privacy_approved_at)
         SELECT $2::uuid, family_id, health_profile_id, batch_id, type, status, replace(original_key, $1::text, $2::text),
           mime_type, size_bytes, replace(ocr_image_key, $1::text, $2::text), ocr_image_sha256, privacy_approved_by,
           privacy_approved_at
         FROM source_documents WHERE id = $1::uuid`,
        [first.documentId, id],
      );
      docs.push({ familyId: first.familyId, documentId: id });
    }
    await fx.owner.query(`UPDATE families SET extraction_cap_usd = 0.06 WHERE id = $1`, [first.familyId]);
    await setGlobal(0);
    const ai = countingExtractor({ delayMs: 200 });
    const outcomes = await Promise.all(docs.map((doc) => run(ai.extractor, doc)));
    expect(ai.calls).toHaveLength(3);
    expect(outcomes.filter((o) => o.status === 'awaiting_budget')).toHaveLength(3);
    expect(await familySpent(first.familyId)).toBe('0.003390');
    expect(await globalSpent()).toBe('0.003390');
  });

  it('TC-305: lỗi mạng, lượt cuối và dead-letter trả chỗ giữ trên cả hai dòng; chạy lại không tính trùng', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await setGlobal(1);
    await setFamily(doc.familyId, 0.1);
    await expect(run(countingExtractor({ error: new Error('mạng') }).extractor, doc)).rejects.toThrow();
    expect([await familySpent(doc.familyId), await globalSpent()]).toEqual(['0.100000', '1.000000']);
    expect(await run(countingExtractor({ error: new Error('mạng') }).extractor, doc, 2)).toMatchObject({
      status: 'manual_entry',
    });
    await handleRecoverDeadExtractionJob(deps(countingExtractor().extractor), logger)({ id: 'd', data: doc });
    await handleRecoverDeadExtractionJob(deps(countingExtractor().extractor), logger)({ id: 'd', data: doc });
    expect([await familySpent(doc.familyId), await globalSpent()]).toEqual(['0.100000', '1.000000']);
  });

  it('còn trần gia đình nhưng hết trần tổng → awaiting_budget, không để sót tiền giữ chỗ trên dòng gia đình', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await setGlobal(4.99);
    await setFamily(doc.familyId, 0.1);
    const ai = countingExtractor();
    expect(await run(ai.extractor, doc)).toEqual({ status: 'awaiting_budget' });
    expect(ai.calls).toHaveLength(0);
    expect(await familySpent(doc.familyId)).toBe('0.100000');
    expect(await globalSpent()).toBe('4.990000');
  });

  it('tháng mới chưa có dòng nào → tạo dòng tháng rồi dòng gia đình, giữ chỗ thành công', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    expect(await run(countingExtractor().extractor, doc)).toMatchObject({ status: 'pending_review' });
    expect(await familySpent(doc.familyId)).toBe('0.001130');
    expect(await globalSpent()).toBe('0.001130');
  });

  it('chỗ giữ mở từ trước khi có trần gia đình (deploy F03b): quyết toán không làm âm dòng gia đình, chứng từ không kẹt', async () => {
    const doc = await seedExtractingDocument(fx.owner);
    await setGlobal(1.02);
    await setFamily(doc.familyId, 0.001);
    await fx.owner.query(
      `INSERT INTO extraction_reservations(source_document_id, family_id, month, amount_usd) VALUES ($1, $2, '2026-10', 0.02)`,
      [doc.documentId, doc.familyId],
    );
    expect(await run(countingExtractor().extractor, doc)).toMatchObject({ status: 'pending_review' });
    expect(await familySpent(doc.familyId)).toBe('0.000000');
    expect(await globalSpent()).toBe('1.001130');
  });
});
