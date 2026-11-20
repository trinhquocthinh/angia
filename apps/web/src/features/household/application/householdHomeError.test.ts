import { expect, it } from 'vitest';
import { householdHomeError } from './householdHomeError';

it('SPEC-068: ánh xạ mã lỗi trao quyền Chủ hộ sang thông báo tiếng Việt chuẩn', () => {
  expect(householdHomeError({ code: 'ERR_OWNERSHIP_TRANSFER_PENDING' }, 'ownership')).toBe(
    'Đang có đề nghị trao quyền Chủ hộ chờ trả lời.',
  );
  expect(householdHomeError({ code: 'ERR_NOT_FOUND' }, 'ownership')).toBe(
    'Đề nghị trao quyền không còn hiệu lực.',
  );
  expect(householdHomeError({ code: 'ERR_FORBIDDEN' }, 'ownership')).toBe(
    'Bạn không có quyền thực hiện thao tác này.',
  );
  expect(householdHomeError({ code: 'ERR_VALIDATION' }, 'ownership')).toBe(
    'Dữ liệu gửi lên không đúng định dạng quy định.',
  );
});

it('SPEC-067: ánh xạ mã lỗi rời nhà sang thông báo tiếng Việt chuẩn', () => {
  expect(householdHomeError({ code: 'ERR_OWNER_MUST_TRANSFER' }, 'leave')).toBe(
    'Hãy trao quyền Chủ hộ cho người khác trước khi rời nhà.',
  );
  expect(householdHomeError({ code: 'ERR_OWNER_MUST_DELETE_FAMILY' }, 'leave')).toBe(
    'Bạn là người duy nhất trong nhà. Hãy xoá nhà thay vì rời nhà.',
  );
  expect(householdHomeError({ code: 'ERR_LAST_GUARDIAN' }, 'leave')).toBe(
    'Bạn là người giám hộ duy nhất của một hồ sơ trẻ. Thêm người giám hộ khác hoặc xoá hồ sơ trước.',
  );
  expect(householdHomeError({ code: 'ERR_VALIDATION' }, 'leave')).toBe(
    'Dữ liệu gửi lên không đúng định dạng quy định.',
  );
});

it('SPEC-069: ánh xạ mã lỗi xoá nhà gồm ERR_RECENT_REMOVAL kèm thời điểm và ERR_VALIDATION', () => {
  expect(householdHomeError({ code: 'ERR_FAMILY_NOT_EMPTY' }, 'deletion')).toBe(
    'Chỉ xoá được khi bạn là người duy nhất trong nhà.',
  );
  expect(householdHomeError({ code: 'ERR_DELETION_PENDING' }, 'deletion')).toBe(
    'Nhà đang có yêu cầu xoá chờ xử lý.',
  );
  expect(householdHomeError({ code: 'ERR_VALIDATION' }, 'deletion')).toBe('Tên nhà chưa khớp.');
  expect(householdHomeError({ code: 'ERR_NOT_FOUND' }, 'deletion')).toBe(
    'Yêu cầu xoá nhà không còn hiệu lực.',
  );

  const allowedAt = new Date(2026, 10, 25, 9, 5).toISOString();
  expect(householdHomeError({ code: 'ERR_RECENT_REMOVAL', details: { allowedAt } }, 'deletion')).toBe(
    'Chưa thể xoá nhà. Bạn xoá được từ 25/11/2026 09:05.',
  );
  expect(householdHomeError({ code: 'ERR_RECENT_REMOVAL' }, 'deletion')).toBe(
    'Chưa thể xoá nhà do vừa gỡ thành viên gần đây.',
  );
  expect(householdHomeError({ code: 'UNKNOWN' }, 'deletion')).toBe(
    'Chưa thể thực hiện thao tác. Vui lòng thử lại.',
  );
});
