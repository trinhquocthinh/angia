import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { MedicationRequestError } from '../application/MedicationRequestError';
import { createMedicationCatalogRepository } from './createMedicationCatalogRepository';
const profileId = '00000000-0000-4000-8000-000000000001';
const course = {
  id: '00000000-0000-4000-8000-000000000002',
  healthProfileId: profileId,
  prescriptionItemId: null,
  source: 'self_reported',
  name: 'Canxi',
  strength: null,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-01',
  endDate: null,
  status: 'active',
  prescriptionIssuedDate: null,
};
const repositoryFor = (respond: (request: Request) => Response) =>
  createMedicationCatalogRepository(
    createClient<paths>({ baseUrl: 'https://test.local', fetch: async (request) => respond(request) }),
  );
describe('Adapter danh mục thuốc (E4-S4-T1)', () => {
  it('TC-238: gọi đúng path và kiểm hợp đồng phản hồi', async () => {
    const urls: string[] = [];
    const repository = repositoryFor((request) => {
      urls.push(request.url);
      return Response.json({ today: '2026-10-11', courses: [course] });
    });
    expect((await repository.current(profileId)).courses[0]!.name).toBe('Canxi');
    expect(urls).toEqual([`https://test.local/api/health-profiles/${profileId}/medication-courses/current`]);
  });
  it('TC-238: lỗi máy chủ dùng thông báo chung của danh mục, lỗi 4xx giữ mã lỗi', async () => {
    await expect(repositoryFor(() => new Response('x', { status: 500 })).current(profileId)).rejects.toThrow(
      'Không thể tải danh mục thuốc. Vui lòng thử lại.',
    );
    const error = await repositoryFor(() =>
      Response.json({ error: { code: 'ERR_CONSENT_REQUIRED', message: 'Cần đồng thuận' } }, { status: 409 }),
    )
      .current(profileId)
      .catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(MedicationRequestError);
    expect(error).toMatchObject({ status: 409, code: 'ERR_CONSENT_REQUIRED' });
  });
});
