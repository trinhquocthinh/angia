import { describe, expect, it } from 'vitest';
import { ReviewRequestError } from '../application/ReviewRequestError';
import { readReviewResponse } from './readReviewResponse';

const response = (status: number) => new Response(null, { status });

describe('Đọc phản hồi API duyệt chứng từ', () => {
  it('trả dữ liệu khi thành công', async () => {
    expect(await readReviewResponse({ data: [1], response: response(200) })).toEqual([1]);
  });

  it('giữ mã lỗi, thông điệp chuẩn và danh sách trường ngoài khoảng', async () => {
    const error = {
      error: {
        code: 'ERR_OUT_OF_RANGE_UNCONFIRMED',
        message: 'Vui lòng kiểm tra',
        details: { fields: ['systolic', 1] },
      },
    };
    await expect(readReviewResponse({ error, response: response(422) })).rejects.toEqual(
      new ReviewRequestError('Vui lòng kiểm tra', 422, 'ERR_OUT_OF_RANGE_UNCONFIRMED', ['systolic']),
    );
    await expect(readReviewResponse({ error, response: response(422) })).rejects.toMatchObject({
      fields: ['systolic'],
    });
  });

  it('lỗi 5xx dùng thông điệp chung, không lộ chi tiết', async () => {
    await expect(
      readReviewResponse({ error: { error: { message: 'stack' } }, response: response(500) }),
    ).rejects.toMatchObject({ message: 'Không thể tải hoặc lưu chứng từ. Vui lòng thử lại.', status: 500 });
  });
});
