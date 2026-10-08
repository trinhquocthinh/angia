import { describe, expect, it } from 'vitest';
import { createMemoryDocumentDeps } from '@src/shared/test/createMemoryDocumentDeps.js';
import { checkUploadTarget } from './checkUploadTarget.js';

describe('TC-110: kiểm điều kiện hồ sơ trong phạm vi gia đình trước upload', () => {
  const profiles = [
    { id: 'ready', familyId: 'a', consentStatus: 'confirmed' as const },
    { id: 'waiting', familyId: 'a', consentStatus: 'invited' as const },
    { id: 'other', familyId: 'b', consentStatus: 'confirmed' as const },
  ];
  it.each([
    ['ready', { ok: true }],
    ['waiting', { ok: false, code: 'ERR_CONSENT_REQUIRED' }],
    ['other', { ok: false, code: 'ERR_NOT_FOUND' }],
    ['missing', { ok: false, code: 'ERR_NOT_FOUND' }],
  ])('%s trả kết quả %j và không ghi chứng từ', async (id, expected) => {
    const memory = createMemoryDocumentDeps(profiles);
    expect(await checkUploadTarget(memory.deps.repository, 'a', id)).toEqual(expected);
    expect(memory.documents).toEqual([]);
    expect(memory.jobs).toEqual([]);
  });
});
