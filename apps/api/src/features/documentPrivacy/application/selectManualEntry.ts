import type { PrivacyOutcome, PrivacyDocument } from '../domain/PrivacyDocument.js';
import type { PrivacyRepository } from './ports.js';
export async function selectManualEntry(
  repo: PrivacyRepository,
  input: { familyId: string; documentId: string },
): Promise<PrivacyOutcome<PrivacyDocument>> {
  return repo.withFamily(input.familyId, async (store) => {
    const doc = await store.findDocument(input.documentId, true);
    if (!doc) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (!['uploaded', 'awaiting_privacy'].includes(doc.status) || doc.privacyApprovedAt)
      return { ok: false, code: 'ERR_INVALID_STATE_TRANSITION' };
    return { ok: true, value: await store.updateDocument(doc.id, { status: 'manual_entry' }) };
  });
}
