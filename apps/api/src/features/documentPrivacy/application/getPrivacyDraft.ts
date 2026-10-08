import type { PrivacyRepository, PrivacyQueueReader, PrivacyDraft } from './ports.js';
import { toPrivacyDraft } from './toPrivacyDraft.js';
export async function getPrivacyDraft(
  repo: PrivacyRepository,
  queue: PrivacyQueueReader,
  input: { familyId: string; documentId: string },
): Promise<{ ok: true; value: PrivacyDraft } | { ok: false; code: 'ERR_NOT_FOUND' }> {
  const doc = await repo.withFamily(input.familyId, (store) => store.findDocument(input.documentId));
  if (!doc) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (doc.privacyDraftStatus !== 'pending' || !doc.privacyDraftId)
    return { ok: true, value: toPrivacyDraft(doc) };
  const state = await queue.state(doc.privacyDraftId);
  if (state !== null && !['completed', 'failed', 'cancelled'].includes(state))
    return { ok: true, value: toPrivacyDraft(doc) };
  return repo.withFamily(input.familyId, async (store) => {
    const current = await store.findDocument(input.documentId, true);
    if (!current) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (
      current.status === 'awaiting_privacy' &&
      current.privacyDraftId === doc.privacyDraftId &&
      current.privacyDraftStatus === 'pending'
    )
      return {
        ok: true,
        value: toPrivacyDraft(await store.updateDocument(current.id, { privacyDraftStatus: 'failed' })),
      };
    return { ok: true, value: toPrivacyDraft(current) };
  });
}
