import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { reminder } from '../application/todayTestFixture.test-helper';
import { createTodayRepository } from './createTodayRepository';

describe('Adapter liều hôm nay (SPEC-079)', () => {
  it('TC-852: tự xem và main đọc đúng route, giữ snapshot và quyền máy chủ', async () => {
    const calls: Request[] = [];
    const client = createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (request) => {
        calls.push(request);
        return Response.json([reminder]);
      },
    });
    const repository = createTodayRepository(client);
    expect(await repository.listForSelf()).toEqual([reminder]);
    expect(await repository.listForProfile('p')).toEqual([reminder]);
    expect(calls.map((request) => [request.url, request.method, request.cache])).toEqual([
      ['https://test.local/api/me/profile/reminders', 'GET', 'no-store'],
      ['https://test.local/api/health-profiles/p/reminders', 'GET', 'no-store'],
    ]);
  });

  it('TC-852: truyền hủy request tới transport', async () => {
    const controller = new AbortController();
    const repository = createTodayRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: (request) =>
          new Promise((_resolve, reject) => {
            request.signal.addEventListener('abort', () => reject(request.signal.reason));
          }),
      }),
    );
    const pending = repository.listForSelf(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('TC-852: giữ lỗi đồng thuận và từ chối payload sai schema', async () => {
    const repository = (status: number, body: unknown) =>
      createTodayRepository(
        createClient<paths>({
          baseUrl: 'https://test.local',
          fetch: async () => Response.json(body, { status }),
        }),
      );
    await expect(
      repository(409, { error: { code: 'ERR_CONSENT_REQUIRED', message: 'Nội bộ' } }).listForSelf(),
    ).rejects.toMatchObject({ status: 409, code: 'ERR_CONSENT_REQUIRED' });
    await expect(repository(200, [{ ...reminder, canConfirm: 'yes' }]).listForSelf()).rejects.toThrow();
  });

  it('TC-853: tái sử dụng ghi SPEC-046 với body rỗng và CSRF', async () => {
    const calls: { method: string; url: string; body: string; csrf: string | null }[] = [];
    const repository = createTodayRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async (request) => {
          calls.push({
            method: request.method,
            url: request.url,
            body: await request.text(),
            csrf: request.headers.get('x-csrf-token'),
          });
          return request.method === 'DELETE' ? new Response(null, { status: 204 }) : Response.json({});
        },
      }),
    );
    await repository.confirm(reminder.id, 'csrf');
    await repository.undo(reminder.id, 'csrf');
    expect(calls).toEqual([
      {
        method: 'POST',
        url: `https://test.local/api/reminders/${reminder.id}/dose-confirmation`,
        body: '{}',
        csrf: 'csrf',
      },
      {
        method: 'DELETE',
        url: `https://test.local/api/reminders/${reminder.id}/dose-confirmation`,
        body: '',
        csrf: 'csrf',
      },
    ]);
  });
});
