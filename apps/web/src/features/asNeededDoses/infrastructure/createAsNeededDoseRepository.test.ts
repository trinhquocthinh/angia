import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createAsNeededDoseRepository } from './createAsNeededDoseRepository';

const profileId = '00000000-0000-4000-8000-000000000001';
const courseId = '00000000-0000-4000-8000-000000000002';
const dose = {
  id: courseId,
  courseId,
  givenAt: '2026-11-04T07:00:00Z',
  quantity: 0.125,
  unit: 'ml',
  recordedBy: profileId,
  recordedAt: '2026-11-04T07:00:00Z',
};
const request = { courseId, givenAt: dose.givenAt, quantity: dose.quantity, unit: dose.unit };
const query = { courseId, from: '2026-11-01', to: '2026-11-04' };
const repositoryFor = (respond: (request: Request) => Response | Promise<Response>) =>
  createAsNeededDoseRepository(
    createClient<paths>({ baseUrl: 'https://test.local', fetch: async (request) => respond(request) }),
  );

describe('Adapter nhật ký liều Khi cần', () => {
  it('TC-495: đọc đúng hồ sơ/bộ lọc, không lưu cache HTTP; truyền AbortSignal', async () => {
    let captured: Request | undefined;
    const repository = repositoryFor((req) => {
      captured = req;
      return Response.json({ doses: [dose] });
    });
    expect(await repository.list(profileId, query, new AbortController().signal)).toEqual({ doses: [dose] });
    expect(captured?.url).toBe(
      `https://test.local/api/health-profiles/${profileId}/as-needed-doses?courseId=${courseId}&from=2026-11-01&to=2026-11-04`,
    );
    expect(captured?.cache).toBe('no-store');
    expect(captured?.signal).toBeDefined();
    await repository.list(null, query);
    expect(captured?.url).toContain('/api/me/profile/as-needed-doses?');
  });
  it('TC-495/499: ghi/xóa đúng liều và CSRF; xóa nhận 204', async () => {
    const calls: Request[] = [];
    const repository = repositoryFor((req) => {
      calls.push(req);
      return req.method === 'DELETE'
        ? new Response(null, { status: 204 })
        : Response.json(dose, { status: 201 });
    });
    expect(await repository.record(profileId, request, 'csrf')).toEqual(dose);
    await repository.remove(profileId, dose.id, 'csrf');
    expect(calls.map((req) => [req.method, req.headers.get('X-CSRF-Token')])).toEqual([
      ['POST', 'csrf'],
      ['DELETE', 'csrf'],
    ]);
    expect(await calls[0]!.json()).toEqual(request);
    expect(calls[1]!.url.endsWith(`/as-needed-doses/${dose.id}`)).toBe(true);
  });
  it('TC-496: sửa và xóa khoảng cách dùng PUT, giữ nguồn API trả về', async () => {
    const calls: Request[] = [];
    const result = { courseId, interval: { text: 'cách 4–6 giờ', source: 'prescription' } };
    const repository = repositoryFor((req) => {
      calls.push(req);
      return Response.json(result);
    });
    expect(await repository.setInterval(profileId, courseId, 'theo nhãn', 'csrf')).toEqual(result);
    await repository.setInterval(profileId, courseId, null, 'csrf');
    expect(calls[0]!.method).toBe('PUT');
    expect(calls[0]!.url.endsWith(`/medication-courses/${courseId}/interval`)).toBe(true);
    expect(calls[0]!.headers.get('X-CSRF-Token')).toBe('csrf');
    expect(await calls[1]!.json()).toEqual({ text: null });
  });
  it('TC-498: lỗi nghiệp vụ giữ mã; phản hồi sai schema bị chặn', async () => {
    await expect(
      repositoryFor(() =>
        Response.json({ error: { code: 'ERR_VALIDATION', message: 'Đợt không hợp lệ' } }, { status: 422 }),
      ).record(profileId, request, 'csrf'),
    ).rejects.toMatchObject({ status: 422, code: 'ERR_VALIDATION' });
    await expect(
      repositoryFor(() => Response.json({ doses: [{}] })).list(profileId, query),
    ).rejects.toThrow();
    await expect(
      repositoryFor(() => new Response('secret', { status: 500 })).list(profileId, query),
    ).rejects.toThrow('Không thể tải nhật ký liều. Vui lòng thử lại.');
  });
});
