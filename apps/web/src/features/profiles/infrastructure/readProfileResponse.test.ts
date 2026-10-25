import { describe, expect, it } from 'vitest';
import { readProfileResponse } from './readProfileResponse';
import { ProfileRequestError } from '../application/ProfileRequestError';
describe('Lỗi API hồ sơ có trạng thái và thông báo chính xác', () => {
  it('đọc dữ liệu thành công', async () => {
    await expect(
      readProfileResponse({ response: new Response(null, { status: 200 }), data: [] }),
    ).resolves.toEqual([]);
  });
  it('giữ mã lỗi và trạng thái để làm mới phiên khi bị từ chối', async () => {
    try {
      await readProfileResponse({
        response: new Response(null, { status: 403 }),
        error: { error: { code: 'ERR_FORBIDDEN', message: 'Bạn không có quyền.' } },
      });
      throw new Error('Phải từ chối');
    } catch (error) {
      expect(error).toBeInstanceOf(ProfileRequestError);
      expect(error).toMatchObject({ status: 403, code: 'ERR_FORBIDDEN', message: 'Bạn không có quyền.' });
    }
  });
});
