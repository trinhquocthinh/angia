import { afterEach, expect, it, vi } from 'vitest';
import { apiClient } from '@src/shared/api/apiClient';
import { fetchDataExportStatus } from '@src/features/account/infrastructure/fetchDataExportStatus';

const get = vi.spyOn(apiClient, 'GET');
afterEach(() => get.mockReset());

it('TC-819: gọi GET /api/me/data-exports/{id} và trả về trạng thái cùng expiresAt', async () => {
  get.mockResolvedValue({
    data: { status: 'ready', expiresAt: '2026-11-24T00:00:00Z' },
    response: new Response(null, { status: 200 }),
  } as never);
  const result = await fetchDataExportStatus('exp-123');
  expect(get).toHaveBeenCalledExactlyOnceWith('/api/me/data-exports/{id}', {
    params: { path: { id: 'exp-123' } },
  });
  expect(result).toEqual({ ok: true, data: { status: 'ready', expiresAt: '2026-11-24T00:00:00Z' } });
});

it('TC-825/TC-826: trả mã lỗi ERR_NOT_FOUND khi liên kết không hợp lệ hoặc hết hạn', async () => {
  get.mockResolvedValue({
    error: { error: { code: 'ERR_NOT_FOUND', message: 'Nội bộ' } },
    response: new Response(null, { status: 404 }),
  } as never);
  expect(await fetchDataExportStatus('exp-missing')).toEqual({
    ok: false,
    code: 'ERR_NOT_FOUND',
    status: 404,
  });
});

it('lỗi mạng trả NETWORK và lỗi JSON trả UNKNOWN', async () => {
  get.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  expect(await fetchDataExportStatus('exp-1')).toEqual({ ok: false, code: 'NETWORK' });
  get.mockRejectedValueOnce(new SyntaxError('Unexpected token'));
  expect(await fetchDataExportStatus('exp-1')).toEqual({ ok: false, code: 'UNKNOWN' });
});
