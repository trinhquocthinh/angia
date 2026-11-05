import { describe, expect, it } from 'vitest';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import { describeDoseFailure } from './describeDoseFailure';

describe('Thông báo lỗi xác nhận "Đã dùng" (Design §9.6)', () => {
  it('TC-489: qua ngày giải thích rõ, không mời thử lại', () => {
    expect(describeDoseFailure(new MedicationRequestError('Chi tiết', 422, 'ERR_VALIDATION'))).toEqual({
      message: 'Chỉ xác nhận hoặc hủy trong ngày của lời nhắc.',
      canRetry: false,
    });
  });
  it('TC-488: mất quyền dùng thông điệp chung, không lộ lý do', () => {
    expect(describeDoseFailure(new MedicationRequestError('Chi tiết', 404, 'ERR_NOT_FOUND'))).toEqual({
      message: 'Không tìm thấy lời nhắc hoặc bạn không có quyền xác nhận.',
      canRetry: false,
    });
  });
  it('TC-494: rút đồng thuận báo đúng thông điệp hồ sơ', () => {
    expect(describeDoseFailure(new MedicationRequestError('Chi tiết', 409, 'ERR_CONSENT_REQUIRED'))).toEqual({
      message: 'Hồ sơ chưa được đồng ý lưu dữ liệu.',
      canRetry: false,
    });
  });
  it.each([0, 500])('lỗi mạng hoặc máy chủ (%s) giữ thông điệp và cho thử lại', (status) => {
    expect(describeDoseFailure(new MedicationRequestError('Thử lại sau', status))).toEqual({
      message: 'Thử lại sau',
      canRetry: true,
    });
  });
});
