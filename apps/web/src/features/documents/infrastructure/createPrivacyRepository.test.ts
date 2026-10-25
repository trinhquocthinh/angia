import { describe, expect, it } from 'vitest';
import { createPrivacyRepository } from './createPrivacyRepository';
const draftId = '01970000-0000-7000-8000-000000000001';
describe('Adapter API kiểm tra riêng tư', () => {
  it('TC-213: gửi CSRF cùng cookie phiên và đúng tọa độ, không đưa tài khoản/gia đình vào body', async () => {
    const requests: { path: string; options?: RequestInit }[] = [];
    const repository = createPrivacyRepository(async (input, options) => {
      requests.push({ path: String(input), ...(options ? { options } : {}) });
      return Response.json({ state: 'pending', draftId }, { status: 202 });
    });
    const edits = {
      rotation: 90 as const,
      crop: { left: 0, top: 0, width: 1000000, height: 1000000 },
      masks: [],
    };
    expect(await repository.create('doc', edits, 'csrf')).toEqual({ state: 'pending', draftId });
    expect(requests[0]).toMatchObject({
      path: '/api/source-documents/doc/privacy-drafts',
      options: {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'X-CSRF-Token': 'csrf' },
      },
    });
    expect(JSON.parse(requests[0]!.options!.body as string)).toEqual(edits);
  });
  it('TC-214: từ chối ảnh trả về khác origin hoặc khác phiên bản', async () => {
    const repository = createPrivacyRepository(async () =>
      Response.json({
        state: 'ready',
        draftId,
        sha256: 'a'.repeat(64),
        imageUrl: 'https://evil.test/private.png',
      }),
    );
    await expect(repository.read('doc')).rejects.toThrow();
  });
});
