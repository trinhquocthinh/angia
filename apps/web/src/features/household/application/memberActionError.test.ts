import { expect, it } from 'vitest';
import { memberActionError } from './memberActionError';

it('SPEC-066: ERR_LAST_GUARDIAN trả thông báo có tên thành viên giám hộ duy nhất', () => {
  expect(memberActionError('ERR_LAST_GUARDIAN', 'Anh Tuấn')).toBe(
    'Anh Tuấn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác trước khi gỡ hoặc đổi vai trò.',
  );
  expect(memberActionError('ERR_LAST_GUARDIAN')).toBe(
    'Thành viên này là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác trước khi gỡ hoặc đổi vai trò.',
  );
});

it('SPEC-066: ERR_OWNER_PROTECTED và ERR_NOT_FOUND trả thông báo đúng ngữ cảnh thành viên', () => {
  expect(memberActionError('ERR_OWNER_PROTECTED')).toContain('Chủ hộ');
  expect(memberActionError('ERR_NOT_FOUND')).toContain('không còn trong nhà');
});

it('SPEC-066: lỗi chung tái dùng householdErrorMessage và không rơi về câu tạo nhà', () => {
  expect(memberActionError('ERR_FORBIDDEN')).toBe('Bạn không có quyền thực hiện thao tác này.');
  expect(memberActionError('ERR_RATE_LIMITED')).toBe('Bạn thao tác quá nhanh, vui lòng thử lại sau.');
  expect(memberActionError('ERR_AUTH_UNAVAILABLE')).toBe(
    'Hệ thống xác thực đang bận hoặc tạm gián đoạn. Vui lòng thử lại sau.',
  );
  expect(memberActionError('ERR_VALIDATION')).toBe('Dữ liệu gửi lên không đúng định dạng quy định.');
  expect(memberActionError('NETWORK')).toBe('Mất kết nối. Kiểm tra mạng rồi thử lại.');
  expect(memberActionError('UNKNOWN')).not.toContain('tạo nhà');
  expect(memberActionError('ERR_SOMETHING_NEW')).not.toContain('tạo nhà');
});
