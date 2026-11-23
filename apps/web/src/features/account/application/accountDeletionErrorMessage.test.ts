import { expect, it } from 'vitest';
import { accountDeletionErrorMessage } from '@src/features/account/application/accountDeletionErrorMessage';

it.each([
  ['TC-830', 'ERR_INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu chưa đúng.'],
  ['TC-829', 'ERR_OWNER_MUST_TRANSFER', 'Hãy trao quyền Chủ hộ cho người khác trước.'],
  [
    'SPEC-073',
    'ERR_OWNER_MUST_DELETE_FAMILY',
    'Bạn là người duy nhất trong nhà. Hãy xoá nhà nếu không dùng nữa.',
  ],
  [
    'SPEC-073',
    'ERR_LAST_GUARDIAN',
    'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Hãy thêm người giám hộ khác trước.',
  ],
  ['SPEC-073', 'ERR_RATE_LIMITED', 'Bạn thao tác quá nhanh, vui lòng thử lại sau.'],
  ['SPEC-073', 'NETWORK', 'Mất kết nối. Kiểm tra mạng rồi thử lại.'],
  ['SPEC-073', 'UNKNOWN', 'Không thể kết nối. Vui lòng thử lại.'],
])('%s: ánh xạ mã lỗi %s sang đúng chuỗi hiển thị', (_tc, code, expected) => {
  expect(accountDeletionErrorMessage(code)).toBe(expected);
});
