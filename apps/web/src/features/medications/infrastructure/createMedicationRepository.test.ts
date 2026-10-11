import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { MedicationRequestError } from '../application/MedicationRequestError';
import { createMedicationRepository } from './createMedicationRepository';
const id = '00000000-0000-4000-8000-000000000001';
const oldId = '00000000-0000-4000-8000-000000000002';
const body = {
  name: 'Canxi',
  strength: '500mg',
  quantityPerDose: 0.5,
  doseUnit: 'viên',
  slots: ['morning'] as 'morning'[],
  startDate: '2026-10-01',
  resolution: 'parallel' as const,
  expectedConflictCourseIds: [oldId],
};
const saved = {
  ...body,
  id,
  healthProfileId: id,
  prescriptionItemId: null,
  source: 'self_reported',
  endDate: null,
  status: 'active',
};
describe('Adapter API thuốc bổ', () => {
  it('TC-049: đúng route/CSRF, gửi đủ lựa chọn và kiểm hợp đồng response', async () => {
    let sent: Request | null = null;
    const client = createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (request) => {
        sent = request;
        return Response.json(saved, { status: 201 });
      },
    });
    const result = await createMedicationRepository(client).create(id, body, 'csrf');
    expect(result).toMatchObject({ id, strength: '500mg', endDate: null, source: 'self_reported' });
    expect(sent!.url).toBe(`https://test.local/api/health-profiles/${id}/medication-courses`);
    expect(sent!.headers.get('x-csrf-token')).toBe('csrf');
    expect(await sent!.json()).toEqual(body);
  });
  it('TC-049: 409 giữ đủ danh sách xung đột và hàm lượng cho UI', async () => {
    const conflicts = [
      {
        itemIndexes: [0],
        nameNormalized: 'canxi',
        courses: [
          {
            id: oldId,
            name: 'CANXI',
            strength: '250mg',
            quantityPerDose: 1,
            doseUnit: 'viên',
            slots: ['evening'],
            startDate: '2026-09-01',
            endDate: null,
          },
        ],
      },
    ];
    const client = createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async () =>
        Response.json(
          {
            error: {
              code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
              message: 'Cần đối soát',
              details: { conflicts },
            },
          },
          { status: 409 },
        ),
    });
    await expect(createMedicationRepository(client).create(id, body, 'csrf')).rejects.toMatchObject({
      status: 409,
      code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
      conflicts,
    });
  });
  it('TC-050: giữ mã lỗi nghiệp vụ; lỗi 500 không lộ thông điệp hạ tầng', async () => {
    for (const status of [422, 500]) {
      const client = createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () =>
          Response.json(
            {
              error: {
                code: status === 422 ? 'ERR_DOSE_INFO_MISSING' : 'ERR_INTERNAL',
                message: 'Thông tin riêng',
              },
            },
            { status },
          ),
      });
      const result = createMedicationRepository(client).create(id, body, 'csrf');
      await expect(result).rejects.toBeInstanceOf(MedicationRequestError);
      await expect(result).rejects.toMatchObject({
        status,
        message: status === 422 ? 'Thông tin riêng' : 'Không thể lưu thuốc bổ. Vui lòng thử lại.',
      });
    }
  });
});
