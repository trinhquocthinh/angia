import { describe, expect, it } from 'vitest';
import type { PrivacyDraft } from '@angia/contracts';
import type { PrivacyRepository } from './privacyPorts';
import { preparePrivacyDraft } from './preparePrivacyDraft';
const edits = { rotation: 0 as const, crop: { left: 0, top: 0, width: 1000000, height: 1000000 }, masks: [] };
describe('Khôi phục yêu cầu tạo ảnh mất phản hồi', () => {
  it('TC-211: chỉ POST một lần rồi GET lấy bản nháp mới', async () => {
    const requests: string[] = [];
    const repository = {
      create: async () => {
        requests.push('POST');
        throw new TypeError('Mất mạng');
      },
      read: async () => {
        requests.push('GET');
        return { state: 'pending', draftId: 'new' };
      },
    } as unknown as PrivacyRepository;
    expect(await preparePrivacyDraft(repository, 'doc', edits, 'csrf', 'old')).toEqual({
      state: 'pending',
      draftId: 'new',
    });
    expect(requests).toEqual(['POST', 'GET']);
  });
  it('TC-212: không xem bản cũ là kết quả của vùng vừa sửa', async () => {
    const draft: PrivacyDraft = {
      state: 'ready',
      draftId: 'old',
      sha256: 'a'.repeat(64),
      imageUrl: '/old.png',
    };
    const repository = {
      create: async () => {
        throw new Error('Mất mạng');
      },
      read: async () => draft,
    } as unknown as PrivacyRepository;
    await expect(preparePrivacyDraft(repository, 'doc', edits, 'csrf', 'old')).rejects.toThrow('Mất mạng');
  });
});
