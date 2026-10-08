import type { PrivacyEdits } from '@angia/contracts';
import type { PrivacyRepository } from './privacyPorts';
export async function preparePrivacyDraft(
  repository: PrivacyRepository,
  id: string,
  edits: PrivacyEdits,
  csrfToken: string,
  previousId: string | null,
) {
  try {
    return await repository.create(id, edits, csrfToken);
  } catch (error) {
    // POST có thể đã ghi dù mất phản hồi; chỉ đọc lại, không tự gửi lần hai.
    const recovered = await repository.read(id).catch(() => null);
    if (recovered && recovered.state !== 'none' && recovered.draftId !== previousId) return recovered;
    throw error;
  }
}
