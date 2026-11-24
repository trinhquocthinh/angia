import { expect, it } from 'vitest';
import {
  buildExportProfileOptions,
  resolveExportScope,
} from '@src/features/account/application/exportProfileOptions';

const sampleProfiles = [
  { id: 'prof-me', displayName: 'Lan', hasLinkedAccount: true },
  { id: 'prof-child', displayName: 'Bé An', hasLinkedAccount: false },
  { id: 'prof-grandpa', displayName: 'Ông Nội', hasLinkedAccount: false },
  { id: 'prof-dad', displayName: 'Bố Minh', hasLinkedAccount: true },
];

it('TC-820/TC-821: Chủ hộ nhận lựa chọn mặc định và chỉ các hồ sơ chưa liên kết tài khoản', () => {
  expect(buildExportProfileOptions(sampleProfiles, true)).toEqual([
    { value: 'self', label: 'Dữ liệu của tôi' },
    { value: 'prof-child', label: 'Bé An' },
    { value: 'prof-grandpa', label: 'Ông Nội' },
  ]);
});

it('TC-819: người không phải Chủ hộ không có danh sách chọn hồ sơ', () => {
  expect(buildExportProfileOptions(sampleProfiles, false)).toEqual([]);
});

it('TC-819/TC-820: ánh xạ phạm vi tải self và profileId chính xác', () => {
  expect(resolveExportScope('self')).toBe('self');
  expect(resolveExportScope('prof-child')).toEqual({ profileId: 'prof-child' });
});
