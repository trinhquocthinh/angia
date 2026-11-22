import { expect, it } from 'vitest';
import { resolveExportScope } from './resolveExportScope.js';

const account = { id: 'a', familyId: 'f', familyRole: 'main', healthProfileId: 'p' };
const profile = { id: 'p', familyId: 'f', linkedToOther: false };
it.each([
  ['TC-819: self lấy hồ sơ liên kết', account, null, profile, 'p'],
  ['TC-819: self không nhà chỉ lấy tài khoản', { ...account, familyId: null }, null, profile, null],
  ['TC-819: self chưa liên kết chỉ lấy tài khoản', { ...account, healthProfileId: null }, null, null, null],
  [
    'TC-822: self vẫn lấy hồ sơ đã rút đồng thuận',
    account,
    null,
    { ...profile, consentStatus: 'withdrawn' },
    'p',
  ],
  ['TC-820: main lấy hồ sơ không liên kết', account, 'p', profile, 'p'],
  ['TC-821: từ chối hồ sơ liên kết người khác', account, 'p', { ...profile, linkedToOther: true }, false],
  ['TC-821: member không được chỉ định hồ sơ', { ...account, familyRole: 'member' }, 'p', profile, false],
  ['TC-821: từ chối hồ sơ khác nhà', account, 'p', { ...profile, familyId: 'f2' }, false],
  ['TC-821: từ chối hồ sơ không tồn tại', account, 'p', null, false],
  ['TC-820: main lấy hồ sơ liên kết chính mình', account, 'p', profile, 'p'],
  ['TC-819: self không lấy hồ sơ ngoài nhà', account, null, { ...profile, familyId: 'f2' }, null],
] as const)('%s', (_name, caller, requested, target, expected) => {
  expect(resolveExportScope(caller, requested, target)).toBe(expected);
});
