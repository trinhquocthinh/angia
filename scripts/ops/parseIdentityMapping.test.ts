import { describe, expect, it } from 'vitest';
import { parseIdentityMapping } from './parseIdentityMapping.js';

const account = {
  accountId: '00000000-0000-4000-8000-000000000001',
  oidcSubject: 'oidc-thu-a',
  familyId: null,
  familyRole: null,
  isSystemAdmin: true,
  displayName: 'Người Thử A',
  currentUsername: null,
  hasCredential: false,
  username: 'nha-a.chu',
  status: 'migrate',
};
const mapping = {
  format: 'angia-identity-mapping/1',
  generatedAt: '2026-11-15T00:00:00.000Z',
  accounts: [account],
  skipped: [],
};

describe('Kiểm định mapping danh tính', () => {
  it('TC-900: nhận mapping hợp lệ', () => {
    expect(parseIdentityMapping(mapping)).toEqual(mapping);
  });
  it('TC-900: subject là chuỗi khác NULL vẫn được kiểm kê dù rỗng', () => {
    const input = { ...mapping, accounts: [{ ...account, oidcSubject: '' }] };
    expect(parseIdentityMapping(input)).toEqual(input);
  });
  it.each(['', 'ab', 'TEN-THU', 'thu name', 'tên-thử', 'a'.repeat(33)])(
    'TC-900: từ chối username sai định dạng (ca %#)',
    (username) => {
      expect(() => parseIdentityMapping({ ...mapping, accounts: [{ ...account, username }] })).toThrow(
        /Dòng 1/,
      );
    },
  );
  it('TC-900: từ chối accountId trùng kể cả cách viết hoa UUID', () => {
    const entry = { ...account, accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
    expect(() =>
      parseIdentityMapping({
        ...mapping,
        accounts: [entry, { ...entry, accountId: entry.accountId.toUpperCase(), username: 'nha-b.chu' }],
      }),
    ).toThrow(/Dòng 2.*accountId/);
  });
  it('TC-900: từ chối username trùng trong file, kể cả dòng defer', () => {
    expect(() =>
      parseIdentityMapping({
        ...mapping,
        accounts: [
          account,
          { ...account, accountId: '00000000-0000-4000-8000-000000000002', status: 'defer' },
        ],
      }),
    ).toThrow(/Dòng 2.*username/);
  });
  it('TC-908: defer không cần username hợp lệ', () => {
    const input = { ...mapping, accounts: [{ ...account, status: 'defer', username: '' }] };
    expect(parseIdentityMapping(input)).toEqual(input);
  });
  it('TC-900: từ chối format sai', () => {
    expect(() => parseIdentityMapping({ ...mapping, format: 'other' })).toThrow(/định dạng/);
  });
  it('TC-900: lỗi nêu chỉ số dòng, không lộ tên hoặc username', () => {
    try {
      parseIdentityMapping({ ...mapping, accounts: [{ ...account, username: 'TEN-BI-MAT' }] });
      expect.fail('Phải từ chối username sai');
    } catch (error) {
      expect((error as Error).message).toMatch(/Dòng 1/);
      expect((error as Error).message).not.toMatch(/TEN-BI-MAT|Người Thử A/);
    }
  });
});
