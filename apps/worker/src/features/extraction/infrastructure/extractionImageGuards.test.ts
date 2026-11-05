import { expect, it } from 'vitest';
import { createMemoryExtractionDeps } from '@src/shared/test/createMemoryExtractionDeps.js';
import { createFallbackExtractor } from './createFallbackExtractor.js';
import { extractDocument } from '../application/extractDocument.js';

const job = { documentId: 'doc-1', familyId: 'family-a', finalAttempt: false };
const result = { ok: true as const, content: { type: 'prescription' as const, items: [{ name: 'A' }] } };

it('TC-420: hash byte đổi ở lượt retry → nhập tay, không gửi thêm AI hoặc trừ lượt mới', async () => {
  const memory = createMemoryExtractionDeps({ result: new Error('HTTP 503') });
  await expect(extractDocument(memory.deps, job)).rejects.toThrow('HTTP 503');
  expect(memory.extractorCalls).toHaveLength(1);
  memory.objects.set(memory.imageKey, new Uint8Array([0xff, 0xd8, 1]));
  expect(await extractDocument(memory.deps, job)).toEqual({
    status: 'manual_entry',
    reason: 'image_unusable',
    costUsd: 0,
  });
  expect(memory.extractorCalls).toHaveLength(1);
  expect(memory.ledger.usedScans()).toBe(1);
  expect(memory.ledger.hasReservation()).toBe(false);
});

it('TC-420: chứng từ bị xóa sau đọc ảnh → bỏ qua, không gửi AI và trả lượt giữ', async () => {
  const memory = createMemoryExtractionDeps({ result });
  const get = memory.deps.ocrImages.get;
  memory.deps.ocrImages.get = async (key) => {
    const image = await get(key);
    const original = memory.deps.repository.withFamily;
    memory.deps.repository.withFamily = (family, work) =>
      original(family, (store) => work({ ...store, findDocument: async () => null }));
    return image;
  };
  expect(await extractDocument(memory.deps, job)).toEqual({ status: 'skipped' });
  expect(memory.extractorCalls).toHaveLength(0);
  expect(memory.ledger.usedScans()).toBe(0);
  expect(memory.ledger.hasReservation()).toBe(false);
});

it.each(['deleted', 'consent', 'hash', 'key'] as const)(
  'TC-420: %s thay đổi sau model chính → chặn fallback trước dispatch',
  async (change) => {
    const memory = createMemoryExtractionDeps({ result });
    const fallback = memory.deps.extractor;
    let primaryCalls = 0;
    memory.deps.extractor = createFallbackExtractor(
      {
        extract: async (_image, beforeDispatch) => {
          await beforeDispatch?.();
          primaryCalls++;
          const original = memory.deps.repository.withFamily;
          memory.deps.repository.withFamily = (family, work) =>
            original(family, (store) =>
              work({
                ...store,
                findDocument: async (id) => {
                  const document = await store.findDocument(id);
                  if (!document || change === 'deleted') return null;
                  if (change === 'consent') return { ...document, profileConsentConfirmed: false };
                  if (change === 'hash') return { ...document, imageSha256: 'b'.repeat(64) };
                  return { ...document, imageKey: `${document.imageKey}.changed` };
                },
              }),
            );
          throw new Error('HTTP 503');
        },
      },
      fallback,
    );
    const outcome = await extractDocument(memory.deps, job);
    expect(outcome).toEqual(
      change === 'deleted'
        ? { status: 'skipped' }
        : {
            status: 'manual_entry',
            reason: change === 'consent' ? 'consent_required' : 'privacy_required',
            costUsd: 0,
          },
    );
    expect(primaryCalls).toBe(1);
    expect(memory.extractorCalls).toHaveLength(0);
    expect(memory.ledger.dispatches()).toBe(1);
    expect(memory.ledger.usedScans()).toBe(1);
    expect(memory.ledger.hasReservation()).toBe(false);
  },
);
