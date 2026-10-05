import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { fetchCurrentSession } from './fetchCurrentSession';

vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { GET: vi.fn() } }));
const get = vi.mocked(apiClient.GET);
afterEach(() => vi.resetAllMocks());

describe('Đọc ngữ cảnh phiên từ /api/me', () => {
  it('401: trả null để hiển thị màn đăng nhập', async () => {
    get.mockResolvedValue({
      response: new Response(null, { status: 401 }),
      error: { error: { code: 'ERR_UNAUTHENTICATED', message: 'Chưa đăng nhập' } },
    });
    await expect(fetchCurrentSession()).resolves.toBeNull();
  });
  it('200: trả đúng tài khoản, nhóm, vai trò và CSRF từ backend', async () => {
    const data = {
      account: { id: 'account', displayName: 'Thịnh', isSystemAdmin: false, healthProfileId: null },
      family: null,
      role: null,
      csrfToken: 'csrf',
    };
    get.mockResolvedValue({ response: new Response(), data });
    const controller = new AbortController();
    await expect(fetchCurrentSession(controller.signal)).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith('/api/me', { signal: controller.signal });
  });
  it.each([403, 500, 503])('%s: báo lỗi kiểm tra phiên, không coi là chưa đăng nhập', async (status) => {
    get.mockResolvedValue({
      response: new Response(null, { status }),
      error: { error: { code: 'ERR_INTERNAL', message: 'Chi tiết nội bộ' } },
    });
    await expect(fetchCurrentSession()).rejects.toThrow('Không thể kiểm tra phiên. Vui lòng thử lại.');
  });
  it('lỗi mạng: truyền lỗi để giao diện cho phép thử lại', async () => {
    get.mockRejectedValue(new TypeError('Không kết nối được'));
    await expect(fetchCurrentSession()).rejects.toThrow('Không kết nối được');
  });
  it('200 thiếu body: báo lỗi thay vì điều hướng nhầm', async () => {
    get.mockResolvedValue({ response: new Response() });
    await expect(fetchCurrentSession()).rejects.toThrow('Không thể kiểm tra phiên. Vui lòng thử lại.');
  });
});
