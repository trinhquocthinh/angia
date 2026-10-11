import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createMedicationStoppingRepository } from './createMedicationStoppingRepository';
const profileId = '00000000-0000-4000-8000-000000000001';
const courseId = '00000000-0000-4000-8000-000000000002';
const course = {
  id: courseId,
  healthProfileId: profileId,
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Canxi',
  strength: null,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: '2026-10-09',
  status: 'stopped',
};
describe('Adapter đọc/dừng thuốc', () => {
  it('TC-051: dùng đúng path, body và token CSRF', async () => {
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
        return Response.json(request.method === 'GET' ? { today: '2026-10-11', courses: [course] } : course);
      },
    });
    const repository = createMedicationStoppingRepository(client);
    expect((await repository.list(profileId)).today).toBe('2026-10-11');
    expect((await repository.stop(profileId, courseId, { stopDate: '2026-10-10' }, 'csrf')).status).toBe(
      'stopped',
    );
    expect(calls).toEqual([
      {
        url: `https://test.local/api/health-profiles/${profileId}/medication-courses/stoppable`,
        method: 'GET',
        csrf: null,
        body: '',
      },
      {
        url: `https://test.local/api/health-profiles/${profileId}/medication-courses/${courseId}/stop`,
        method: 'POST',
        csrf: 'csrf',
        body: '{"stopDate":"2026-10-10"}',
      },
    ]);
  });
  it('TC-052: giữ mã lỗi trạng thái, che thông điệp lỗi server', async () => {
    for (const status of [409, 500]) {
      const client = createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () =>
          Response.json(
            {
              error: {
                code: status === 409 ? 'ERR_INVALID_STATE_TRANSITION' : 'ERR_INTERNAL',
                message: 'Nội bộ',
              },
            },
            { status },
          ),
      });
      await expect(
        createMedicationStoppingRepository(client).stop(
          profileId,
          courseId,
          { stopDate: '2026-10-10' },
          'csrf',
        ),
      ).rejects.toMatchObject({
        status,
        message: status === 409 ? 'Nội bộ' : 'Không thể ghi nhận dừng thuốc. Vui lòng thử lại.',
      });
    }
  });
});
