import { describe, expect, it, vi } from 'vitest';
import { RedactionSuggestionError } from '../application/redactionSuggestionPorts';
import { createRedactionSuggester } from './createRedactionSuggester';

const signal = new AbortController().signal;
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('Gọi API gợi ý vùng che (SPEC-083)', () => {
  it('gửi multipart `image` kèm CSRF tới đúng hồ sơ, đọc `masks`', async () => {
    const masks = [{ left: 1, top: 2, width: 3, height: 4 }];
    const fetchImpl = vi.fn(async () => json(200, { masks }));
    const image = new Blob(['jpeg'], { type: 'image/jpeg' });
    expect(await createRedactionSuggester(fetchImpl).suggest('p/1', image, 'csrf', signal)).toEqual(masks);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/health-profiles/p%2F1/redaction-suggestions');
    expect(init).toMatchObject({ method: 'POST', headers: { 'X-CSRF-Token': 'csrf' }, signal });
    expect((init.body as FormData).get('image')).toBeInstanceOf(Blob);
  });

  it('503 ERR_SUGGESTION_BUSY → busy; lỗi khác hoặc phản hồi sai schema → unavailable', async () => {
    const cases = [
      [json(503, { error: { code: 'ERR_SUGGESTION_BUSY' } }), 'busy'],
      [json(503, { error: { code: 'ERR_SUGGESTION_UNAVAILABLE' } }), 'unavailable'],
      [json(422, { error: { code: 'ERR_VALIDATION' } }), 'unavailable'],
      [json(200, { masks: [{ left: -1 }] }), 'unavailable'],
    ] as const;
    for (const [response, reason] of cases) {
      const suggester = createRedactionSuggester(vi.fn(async () => response));
      await expect(suggester.suggest('p', new Blob(), 'csrf', signal)).rejects.toEqual(
        new RedactionSuggestionError(reason),
      );
    }
  });
});
