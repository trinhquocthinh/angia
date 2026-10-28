import { budgetMonth } from '@angia/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { seedOcrConsentFixture } from '@src/shared/test/seedOcrConsentFixture.js';
import { extractDocument } from '../application/extractDocument.js';

// Các TC AIR được tái kiểm với nguồn mới; không đổi mã TC hay hợp đồng cổng OCR.
describe.each(['main_attested', 'self'] as const)('LG-02: cổng OCR với receipt %s', (source) => {
  let fx: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  beforeAll(async () => {
    fx = await createPrivacyPgFixture();
  });
  afterAll(async () => {
    await fx?.close();
  });
  it('TC-549/TC-555: confirmed đi qua cả hai cổng và chỉ dùng một lượt', async () => {
    const f = await seedOcrConsentFixture(fx, source);
    expect(await extractDocument(f.deps, { ...f.ids, finalAttempt: false })).toEqual({
      status: 'pending_review',
      costUsd: 0.001,
    });
    expect(f.memory.extractorCalls).toHaveLength(1);
    expect(await f.counts()).toEqual({ used: 1, held: 0 });
  });
  it('TC-609: rút đồng thuận sau đọc ảnh chặn gửi AI và trả held', async () => {
    const f = await seedOcrConsentFixture(fx, source);
    const get = f.deps.ocrImages.get;
    f.deps.ocrImages.get = async () => {
      await f.withdraw();
      return get();
    };
    expect(await extractDocument(f.deps, { ...f.ids, finalAttempt: false })).toMatchObject({
      status: 'manual_entry',
      reason: 'consent_required',
    });
    expect(f.memory.extractorCalls).toHaveLength(0);
    expect(await f.counts()).toEqual({ used: 0, held: 0 });
  });
  it('TC-626: retry sau rút đồng thuận trả held của operation cũ, không đọc ảnh', async () => {
    const f = await seedOcrConsentFixture(fx, source);
    await f.deps.repository.withFamily(f.ids.familyId, (store) =>
      store.reserveBudget(f.ids.documentId, {
        month: budgetMonth(f.deps.budget.now()),
        defaultMonthlyCapUsd: 5,
        defaultMonthlyScans: 0,
      }),
    );
    await f.withdraw();
    f.deps.ocrImages.get = async () => {
      throw new Error('Không được đọc ảnh khi thiếu đồng thuận');
    };
    expect(await extractDocument(f.deps, { ...f.ids, finalAttempt: false })).toMatchObject({
      status: 'manual_entry',
      reason: 'consent_required',
    });
    expect(f.memory.extractorCalls).toHaveLength(0);
    expect(await f.counts()).toEqual({ used: 0, held: 0 });
  });
});
