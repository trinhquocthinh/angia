import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createAiBudgetRepository } from './createAiBudgetRepository';

const budget = { month: '2026-10', monthlyCapUsd: 2, spentThisMonthUsd: 3 };
function harness(status = 200, body: unknown = budget) {
  const requests: Request[] = [];
  const client = createClient<paths>({
    baseUrl: 'http://localhost',
    fetch: async (request) => {
      requests.push(request);
      return Response.json(body, { status });
    },
  });
  return { repository: createAiBudgetRepository(client), requests };
}

describe('Ngân sách AI qua hợp đồng HTTP thật (SPEC-013)', () => {
  it('PUT /api/admin/extraction-cap gửi trần mới kèm X-CSRF-Token', async () => {
    const { repository, requests } = harness();
    expect(await repository.setCap(2, 'csrf')).toEqual(budget);
    expect(requests[0]?.method).toBe('PUT');
    expect(new URL(requests[0]?.url ?? '').pathname).toBe('/api/admin/extraction-cap');
    expect(requests[0]?.headers.get('x-csrf-token')).toBe('csrf');
    expect(await requests[0]?.json()).toEqual({ monthlyCapUsd: 2 });
  });

  it('TC-042: 403 → AdminRequestError ERR_FORBIDDEN', async () => {
    const { repository } = harness(403, { error: { code: 'ERR_FORBIDDEN', message: 'x' } });
    await expect(repository.get()).rejects.toMatchObject({ code: 'ERR_FORBIDDEN', status: 403 });
  });
});
