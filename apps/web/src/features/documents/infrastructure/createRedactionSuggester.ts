import { redactionSuggestionsResponseSchema } from '@angia/contracts';
import { RedactionSuggestionError, type RedactionSuggester } from '../application/redactionSuggestionPorts';

// Multipart gửi bằng fetch: openapi-fetch không mã hoá FormData theo kiểu sinh ra. Hợp đồng vẫn kiểm bằng zod.
export function createRedactionSuggester(fetchImpl: typeof fetch = fetch): RedactionSuggester {
  return {
    async suggest(profileId, image, csrfToken, signal) {
      const form = new FormData();
      form.append('image', image, 'image.jpg');
      const response = await fetchImpl(
        `/api/health-profiles/${encodeURIComponent(profileId)}/redaction-suggestions`,
        {
          method: 'POST',
          body: form,
          headers: { 'X-CSRF-Token': csrfToken },
          credentials: 'same-origin',
          signal,
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const code = (body as { error?: { code?: string } } | null)?.error?.code;
        throw new RedactionSuggestionError(code === 'ERR_SUGGESTION_BUSY' ? 'busy' : 'unavailable');
      }
      const parsed = redactionSuggestionsResponseSchema.safeParse(body);
      if (!parsed.success) throw new RedactionSuggestionError('unavailable');
      return parsed.data.masks;
    },
  };
}
