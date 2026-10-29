import createClient from 'openapi-fetch';
import { describe, expect, it } from 'vitest';
import type { paths } from '@src/shared/api/schema.gen';
import { createReviewRepository } from './createReviewRepository';

const impact = {
  prescriptions: 2,
  prescriptionItems: 5,
  labResults: 1,
  measurements: 3,
  medicationCourses: 4,
  activeMedicationCourses: 2,
};
function repository(response: Response, sent: Request[] = []) {
  return createReviewRepository(
    createClient<paths>({
      baseUrl: 'https://test.local',
      fetch: async (request) => {
        sent.push(request);
        return response;
      },
    }),
  );
}
describe('TC-437 adapter xóa chứng từ', () => {
  it('đọc tác động đúng route, chuyển signal và kiểm response', async () => {
    const sent: Request[] = [];
    const controller = new AbortController();
    expect(await repository(Response.json(impact), sent).deletionImpact('d', controller.signal)).toEqual(
      impact,
    );
    controller.abort();
    expect(sent[0]!.signal.aborted).toBe(true);
    expect(sent[0]!.url).toBe('https://test.local/api/source-documents/d/deletion-impact');
    expect(sent[0]!.method).toBe('GET');
    await expect(
      repository(Response.json({ ...impact, measurements: -1 })).deletionImpact('d'),
    ).rejects.toThrow();
  });
  it('DELETE gửi CSRF, từ khóa XÓA và chấp nhận 204 không body', async () => {
    const sent: Request[] = [];
    await expect(
      repository(new Response(null, { status: 204 }), sent).deleteDocument('d', 'csrf'),
    ).resolves.toBeUndefined();
    expect(sent[0]!.url).toBe('https://test.local/api/source-documents/d');
    expect(sent[0]!.method).toBe('DELETE');
    expect(sent[0]!.headers.get('x-csrf-token')).toBe('csrf');
    expect(await sent[0]!.json()).toEqual({ confirm: 'XÓA' });
  });
  it('giữ lỗi nghiệp vụ, che lỗi server; lỗi mạng vẫn thất bại', async () => {
    await expect(
      repository(
        Response.json(
          { error: { code: 'ERR_CONSENT_REQUIRED', message: 'Hồ sơ đã rút đồng thuận.' } },
          { status: 403 },
        ),
      ).deleteDocument('d', 'csrf'),
    ).rejects.toMatchObject({ status: 403, code: 'ERR_CONSENT_REQUIRED' });
    await expect(
      repository(Response.json({ error: { message: 'stack' } }, { status: 500 })).deleteDocument('d', 'csrf'),
    ).rejects.toThrow('Không thể tải hoặc lưu chứng từ. Vui lòng thử lại.');
    const failed = createReviewRepository(
      createClient<paths>({
        baseUrl: 'https://test.local',
        fetch: async () => {
          throw new TypeError('network');
        },
      }),
    );
    await expect(failed.deleteDocument('d', 'csrf')).rejects.toThrow('network');
  });
});
