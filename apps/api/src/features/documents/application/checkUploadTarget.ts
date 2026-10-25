import type { DocumentRepository } from './ports.js';

// Transaction ngắn trước khi đọc body; uploadDocument vẫn kiểm lại trong transaction ghi.
export async function checkUploadTarget(
  repository: DocumentRepository,
  familyId: string,
  profileId: string,
): Promise<{ ok: true } | { ok: false; code: 'ERR_NOT_FOUND' | 'ERR_CONSENT_REQUIRED' }> {
  return repository.withFamily(familyId, async (store) => {
    const profile = await store.findProfile(profileId);
    if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (profile.consentStatus !== 'confirmed') return { ok: false, code: 'ERR_CONSENT_REQUIRED' };
    return { ok: true };
  });
}
