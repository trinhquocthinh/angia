import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { submitHousehold } from './submitHousehold';

vi.mock('@src/shared/api/apiClient', () => ({ apiClient: { POST: vi.fn() } }));
const request = vi.mocked(apiClient.POST);
afterEach(() => vi.resetAllMocks());
it('TC-767: tạo nhà gửi CSRF và DTO qua API có kiểu', async () => {
  request.mockResolvedValue({
    response: new Response(null, { status: 201 }),
    data: { id: 'family', name: 'Nhà Lan' },
  });
  expect(await submitHousehold({ name: 'Nhà Lan' }, 'csrf')).toEqual({ ok: true });
  expect(request).toHaveBeenCalledWith('/api/families', {
    body: { name: 'Nhà Lan' },
    headers: { 'X-CSRF-Token': 'csrf' },
  });
});
it('TC-769: lỗi API chỉ giữ mã, không trả message nội bộ cho UI', async () => {
  request.mockResolvedValue({
    response: new Response(null, { status: 403 }),
    error: { error: { code: 'ERR_REGISTRATION_CLOSED', message: 'Nội bộ' } },
  });
  expect(await submitHousehold({ name: 'Nhà Lan' }, 'csrf')).toEqual({
    ok: false,
    code: 'ERR_REGISTRATION_CLOSED',
  });
});
it('TC-767: phân biệt mất mạng và body không đọc được', async () => {
  request.mockRejectedValueOnce(new TypeError('fetch failed'));
  expect(await submitHousehold({ name: 'Nhà Lan' }, 'csrf')).toEqual({ ok: false, code: 'NETWORK' });
  request.mockRejectedValueOnce(new SyntaxError('invalid JSON'));
  expect(await submitHousehold({ name: 'Nhà Lan' }, 'csrf')).toEqual({ ok: false, code: 'UNKNOWN' });
});
