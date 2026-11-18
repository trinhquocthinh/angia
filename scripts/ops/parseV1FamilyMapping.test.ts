import { expect, it } from 'vitest';
import { parseV1FamilyMapping } from './parseV1FamilyMapping.js';

const family = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const account = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

it('TC-815: chuẩn hoá UUID trong hai bảng ánh xạ owner xác nhận', () => {
  expect(parseV1FamilyMapping({ [family.toUpperCase()]: account.toUpperCase() }, {})).toEqual({
    owners: { [family]: account },
    creators: {},
  });
});

it.each([null, [], {}, { invalid: account }, { [family]: null }])(
  'TC-816: từ chối ánh xạ Chủ hộ không hợp lệ %j',
  (input) => expect(() => parseV1FamilyMapping(input, {})).toThrow(),
);

it('TC-816: từ chối khoá trùng sau chuẩn hoá và người tạo chưa xác định', () => {
  expect(() => parseV1FamilyMapping({ [family]: account, [family.toUpperCase()]: account }, {})).toThrow();
  expect(() => parseV1FamilyMapping({ [family]: account }, { [family]: null })).toThrow();
});
