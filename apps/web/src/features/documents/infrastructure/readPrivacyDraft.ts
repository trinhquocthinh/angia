import { privacyDraftSchema } from '@angia/contracts';

export function readPrivacyDraft(body: unknown, documentId: string) {
  const draft = privacyDraftSchema.parse(body);
  if (draft.state === 'ready') {
    const expected = `/api/source-documents/${encodeURIComponent(documentId)}/privacy-drafts/${encodeURIComponent(draft.draftId)}/image`;
    if (draft.imageUrl !== expected)
      throw new Error('Đường dẫn bản kiểm tra không hợp lệ. Vui lòng tải lại.');
  }
  return draft;
}
