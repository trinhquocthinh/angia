import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createMyRevisitReminderRepository } from './createMyRevisitReminderRepository';
const id = '00000000-0000-4000-8000-000000000001';
describe('TC-479 — adapter lời nhắc tái khám', () => {
  it('đọc đúng endpoint, kiểm schema và không dùng HTTP cache', async () => {
    let request: Request | undefined;
    const data = {
      id,
      profileId: id,
      profileName: 'Mẹ',
      revisitDate: '2026-11-20',
      offset: 'same_day',
      prescriptions: [],
      canOpenSummary: false,
    };
    const repo = createMyRevisitReminderRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async (input) => {
          request = input;
          return Response.json(data);
        },
      }),
    );
    expect(await repo.get(id)).toEqual(data);
    expect(request?.url).toBe(`https://test.local/api/me/revisit-reminders/${id}`);
    expect(request?.cache).toBe('no-store');
  });
  it('404 giữ trạng thái để trang dùng thông điệp chung', async () => {
    const repo = createMyRevisitReminderRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () =>
          Response.json({ error: { code: 'ERR_NOT_FOUND', message: 'Chi tiết' } }, { status: 404 }),
      }),
    );
    await expect(repo.get(id)).rejects.toMatchObject({ status: 404 });
  });
});
