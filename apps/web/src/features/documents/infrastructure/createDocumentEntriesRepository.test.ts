import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { ReviewRequestError } from '../application/ReviewRequestError';
import { entry, PROFILE_ID, savedPrescription } from '../application/documentEntryFixtures.test-helper';
import { createDocumentEntriesRepository } from './createDocumentEntriesRepository';

const clientReturning = (response: Response, sent: Request[] = []) =>
  createClient<paths>({
    baseUrl: 'https://test.local',
    fetch: async (request) => {
      sent.push(request);
      return response;
    },
  });
const course = {
  id: '00000000-0000-4000-8000-0000000000d1',
  healthProfileId: PROFILE_ID,
  prescriptionItemId: savedPrescription.items[0]!.id,
  source: 'prescription',
  name: 'Amlodipin',
  strength: null,
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['morning'],
  startDate: '2026-10-13',
  endDate: '2026-11-11',
  status: 'active',
};
const reuse = {
  startDate: '2026-10-13',
  items: [{ prescriptionItemId: savedPrescription.items[0]!.id, durationDays: 30, longTerm: false }],
};

describe('TC-284 adapter API danh mục chứng từ và Dùng lại đơn', () => {
  it('liệt kê: đúng route và query, kiểm hợp đồng response', async () => {
    const sent: Request[] = [];
    const page = { items: [entry()], nextCursor: 'abc' };
    const repository = createDocumentEntriesRepository(clientReturning(Response.json(page), sent));
    expect(await repository.page(PROFILE_ID, { type: 'lab_result', cursor: 'abc' })).toEqual(page);
    expect(sent[0]!.url).toBe(
      `https://test.local/api/health-profiles/${PROFILE_ID}/document-entries?type=lab_result&cursor=abc`,
    );
    const broken = createDocumentEntriesRepository(clientReturning(Response.json({ items: [{}] })));
    await expect(broken.page(PROFILE_ID, {})).rejects.toThrow();
  });

  it('dùng lại: POST kèm CSRF và body; 201 trả danh sách đợt', async () => {
    const sent: Request[] = [];
    const repository = createDocumentEntriesRepository(
      clientReturning(Response.json({ courses: [course] }, { status: 201 }), sent),
    );
    expect(await repository.reuse(PROFILE_ID, savedPrescription.id, reuse, 'csrf')).toEqual([course]);
    expect(sent[0]!.method).toBe('POST');
    expect(sent[0]!.url).toBe(
      `https://test.local/api/health-profiles/${PROFILE_ID}/prescriptions/${savedPrescription.id}/reuse`,
    );
    expect(sent[0]!.headers.get('x-csrf-token')).toBe('csrf');
    expect(await sent[0]!.json()).toEqual(reuse);
  });

  it('dùng lại: 409 mang nhóm xung đột; 422 giữ thông điệp; 5xx thông điệp chung', async () => {
    const conflict = {
      error: {
        code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
        message: 'Thuốc này đang trong liệu trình điều trị.',
        details: {
          conflicts: [
            { itemIndexes: [0], nameNormalized: 'amlodipin', courses: [{ ...course, strength: null }] },
          ],
        },
      },
    };
    const call = (response: Response) =>
      createDocumentEntriesRepository(clientReturning(response)).reuse(
        PROFILE_ID,
        savedPrescription.id,
        reuse,
        'c',
      );
    const error409 = await call(Response.json(conflict, { status: 409 })).catch((e: unknown) => e);
    expect(error409).toBeInstanceOf(ReviewRequestError);
    expect((error409 as ReviewRequestError).courseConflicts).toHaveLength(1);
    const error422 = await call(
      Response.json({ error: { code: 'ERR_VALIDATION', message: 'Ngày không hợp lệ.' } }, { status: 422 }),
    ).catch((e: unknown) => e);
    expect((error422 as ReviewRequestError).message).toBe('Ngày không hợp lệ.');
    const error500 = await call(Response.json({ error: { message: 'stack' } }, { status: 500 })).catch(
      (e: unknown) => e,
    );
    expect((error500 as ReviewRequestError).message).not.toBe('stack');
  });
});
