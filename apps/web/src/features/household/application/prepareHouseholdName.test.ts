import { expect, it } from 'vitest';
import { prepareHouseholdName } from './prepareHouseholdName';

it('TC-767: bỏ khoảng trắng hai đầu, giữ dấu và khoảng trắng bên trong tên nhà', () => {
  expect(prepareHouseholdName('  Nhà Lan  ')).toEqual({ name: 'Nhà Lan' });
});
it.each(['', '   ', '\n\t'])('TC-767: tên rỗng %j không được gửi tạo nhà', (name) => {
  expect(prepareHouseholdName(name)).toEqual({ error: 'Vui lòng nhập tên nhà.' });
});
it('TC-767: chấp nhận 60 ký tự và từ chối 61 ký tự', () => {
  expect(prepareHouseholdName('a'.repeat(60))).toEqual({ name: 'a'.repeat(60) });
  expect(prepareHouseholdName('a'.repeat(61))).toEqual({ error: 'Tên nhà không quá 60 ký tự.' });
});

it('SPEC-065: thêm token lập nhà khi có, giữ luồng tạo nhà cũ không token', () => {
  expect(prepareHouseholdName(' Nhà Lan ', 'a'.repeat(43))).toEqual({
    name: 'Nhà Lan',
    invitationToken: 'a'.repeat(43),
  });
  expect(prepareHouseholdName('Nhà Lan')).not.toHaveProperty('invitationToken');
});
