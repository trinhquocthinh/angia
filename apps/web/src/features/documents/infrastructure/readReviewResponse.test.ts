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

  it('ERR_DOSE_INFO_MISSING giữ chỉ số dòng thuốc thiếu thông tin để báo đúng dòng', async () => {
    const error = {
      error: {
        code: 'ERR_DOSE_INFO_MISSING',
        message: 'Thiếu',
        details: { invalidItemIndexes: [1, 'x', 3] },
      },
    };
    await expect(readReviewResponse({ error, response: response(422) })).rejects.toMatchObject({
      code: 'ERR_DOSE_INFO_MISSING',
      invalidItemIndexes: [1, 3],
    });
  });

  it('ERR_DUPLICATE_UNCONFIRMED giữ thông tin bản đã lưu bị trùng (SPEC-012)', async () => {
    const duplicate = {
      duplicateOf: null,
      recordDate: '2026-10-01',
      facility: 'BV Tỉnh',
      savedAt: '2026-10-02T03:00:00.000Z',
    };
    const error = { error: { code: 'ERR_DUPLICATE_UNCONFIRMED', message: 'Trùng', details: duplicate } };
    await expect(readReviewResponse({ error, response: response(409) })).rejects.toMatchObject({
      code: 'ERR_DUPLICATE_UNCONFIRMED',
      duplicate,
    });
    const broken = { error: { code: 'ERR_DUPLICATE_UNCONFIRMED', message: 'Trùng', details: {} } };
    await expect(readReviewResponse({ error: broken, response: response(409) })).rejects.toMatchObject({
      duplicate: null,
    });
  });

  it('lỗi 5xx dùng thông điệp chung, không lộ chi tiết', async () => {
    await expect(
      readReviewResponse({ error: { error: { message: 'stack' } }, response: response(500) }),
    ).rejects.toMatchObject({ message: 'Không thể tải hoặc lưu chứng từ. Vui lòng thử lại.', status: 500 });
  });
});
