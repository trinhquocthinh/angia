import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { paths } from '@src/shared/api/schema.gen';
import { createDoseConfirmationRepository } from './createDoseConfirmationRepository';

const reminderId = '00000000-0000-4000-8000-000000000001';
const profileId = '00000000-0000-4000-8000-000000000002';
const confirmation = {
  reminderId,
  profileId,
  date: '2026-11-02',
  slot: 'morning',
  confirmedBy: { accountId: null, displayName: 'Mẹ' },
  confirmedAt: '2026-11-02T00:35:00.000Z',
};
const reminder = {
  id: reminderId,
  date: '2026-11-02',
  slot: 'morning',
  scheduledAt: '2026-11-02T00:00:00.000Z',
  medications: [{ name: 'Amlodipin', strength: null, quantityPerDose: null, doseUnit: null }],
  confirmation,
  canConfirm: false,
  canUndo: true,
};

describe('Adapter xác nhận "Đã dùng" (SPEC-046)', () => {
  it('dùng đúng path, body rỗng và CSRF; đọc danh sách của ngày theo hồ sơ', async () => {
    const calls: { url: string; method: string; csrf: string | null; body: string }[] = [];
    const client = createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (request) => {
        calls.push({
          url: request.url,
          method: request.method,
          csrf: request.headers.get('x-csrf-token'),
          body: await request.text(),
        });
        if (request.method === 'DELETE') return new Response(null, { status: 204 });
        return Response.json(request.method === 'GET' ? [reminder] : confirmation);
      },
    });
    const repository = createDoseConfirmationRepository(client);
    await repository.confirm(reminderId, 'csrf');
    await repository.undo(reminderId, 'csrf');
    expect((await repository.listForProfile(profileId))[0]?.confirmation?.confirmedBy.displayName).toBe('Mẹ');
    const path = `https://test.local/api/reminders/${reminderId}/dose-confirmation`;
    expect(calls).toEqual([
      { url: path, method: 'POST', csrf: 'csrf', body: '{}' },
      { url: path, method: 'DELETE', csrf: 'csrf', body: '' },
      {
        url: `https://test.local/api/health-profiles/${profileId}/reminders`,
        method: 'GET',
        csrf: null,
        body: '',
      },
    ]);
  });
  it('giữ status và mã lỗi; che thông điệp lỗi máy chủ', async () => {
    const respond = (status: number) =>
      createDoseConfirmationRepository(
        createClient<paths>({
          baseUrl: 'https://test.local',
          fetch: async () =>
            Response.json(
              { error: { code: 'ERR_VALIDATION', message: 'Nội bộ', requestId: 'x' } },
              { status },
            ),
        }),
      ).confirm(reminderId, 'csrf');
    await expect(respond(422)).rejects.toMatchObject({ status: 422, code: 'ERR_VALIDATION' });
    const server = await respond(500).catch((error: MedicationRequestError) => error);
    expect((server as MedicationRequestError).message).toBe('Không thể cập nhật xác nhận. Vui lòng thử lại.');
  });
});
