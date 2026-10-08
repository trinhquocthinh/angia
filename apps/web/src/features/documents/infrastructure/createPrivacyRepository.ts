import { sourceDocumentSchema } from '@angia/contracts';
import type { PrivacyRepository } from '../application/privacyPorts';
import { readReviewResponse } from './readReviewResponse';
import { readPrivacyDraft } from './readPrivacyDraft';

export function createPrivacyRepository(fetcher: typeof fetch = fetch): PrivacyRepository {
  const path = (id: string) => `/api/source-documents/${encodeURIComponent(id)}`;
  const request = async (url: string, options: RequestInit) => {
    const response = await fetcher(url, { credentials: 'same-origin', cache: 'no-store', ...options });
    const body: unknown = await response.json();
    return readReviewResponse<unknown>({ response, ...(response.ok ? { data: body } : { error: body }) });
  };
  const post = (url: string, csrfToken: string, body: unknown) =>
    request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(body),
    });
  return {
    read: async (id, signal) =>
      readPrivacyDraft(
        await request(`${path(id)}/privacy-draft`, { method: 'GET', ...(signal ? { signal } : {}) }),
        id,
      ),
    create: async (id, edits, csrfToken) =>
      readPrivacyDraft(await post(`${path(id)}/privacy-drafts`, csrfToken, edits), id),
    approve: async (id, body, csrfToken) =>
      sourceDocumentSchema.parse(await post(`${path(id)}/privacy-approval`, csrfToken, body)),
    manual: async (id, csrfToken) =>
      sourceDocumentSchema.parse(await post(`${path(id)}/manual-entry`, csrfToken, {})),
  };
}
