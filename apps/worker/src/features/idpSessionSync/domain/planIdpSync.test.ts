import { describe, expect, it } from 'vitest';
import { type DirectoryMember, type LocalAccount, planIdpSync } from './planIdpSync.js';

const acc = (id: string, sub: string, opts: { admin?: boolean; session?: boolean } = {}): LocalAccount => ({
  id,
  oidcSubject: sub,
  isSystemAdmin: opts.admin ?? false,
  hasSession: opts.session ?? true,
});
const mem = (uid: string, isActive = true): DirectoryMember => ({ uid, isActive });
const plan = (
  accounts: LocalAccount[],
  access: DirectoryMember[],
  admins: DirectoryMember[] = [],
  maxRevokes = 10,
) => planIdpSync({ accounts, access, admins, maxRevokes });

describe('Lập kế hoạch đồng bộ phiên với IdP (BR-045)', () => {
  it('TC-324: user bị khóa vẫn trong nhóm truy cập, đang có phiên → thu hồi', () => {
    const result = plan([acc('a1', 's1'), acc('a2', 's2')], [mem('s1', false), mem('s2')]);
    expect(result.revoke).toEqual(['a1']);
    expect(result.capped).toBe(false);
    expect(result.skipReason).toBeUndefined();
  });

  it('TC-325: user bị gỡ nhóm hoặc bị xóa → thu hồi; tài khoản không có phiên không vào danh sách', () => {
    const result = plan([acc('a1', 's1'), acc('a2', 's2'), acc('a3', 's3', { session: false })], [mem('s2')]);
    expect(result.revoke).toEqual(['a1']);
  });

  it('TC-326: gỡ admin hoặc admin bị khóa → adminOff; thêm admin → adminOn; không đổi → rỗng', () => {
    const result = plan(
      [
        acc('removed', 's1', { admin: true }),
        acc('locked', 's2', { admin: true }),
        acc('added', 's3'),
        acc('kept', 's4', { admin: true }),
        acc('plain', 's5'),
      ],
      [mem('s1'), mem('s2', false), mem('s3'), mem('s4'), mem('s5')],
      [mem('s2', false), mem('s3'), mem('s4')],
    );
    expect(result.adminOff).toEqual(['removed', 'locked']);
    expect(result.adminOn).toEqual(['added']);
    // admin bị khóa vừa mất phiên vừa mất quyền
    expect(result.revoke).toEqual(['locked']);
  });

  it('TC-327: nhóm truy cập rỗng → access_group_empty, không thu hồi, không đổi admin', () => {
    const result = plan([acc('a1', 's1', { admin: true }), acc('a2', 's2')], [], [mem('s2')]);
    expect(result).toEqual({
      revoke: [],
      adminOn: [],
      adminOff: [],
      capped: false,
      skipReason: 'access_group_empty',
    });
  });

  it('TC-335: không tài khoản nào khớp thành viên active của nhóm truy cập (sai nhóm/sai subject mode) → bỏ qua', () => {
    const accounts = [acc('a1', 's1', { admin: true }), acc('a2', 's2', { session: false })];
    expect(plan(accounts, [mem('other-1'), mem('other-2')], [mem('s1')])).toEqual({
      revoke: [],
      adminOn: [],
      adminOff: [],
      capped: false,
      skipReason: 'access_group_no_match',
    });
    // tài khoản không có phiên vẫn được tính khớp: khóa người duy nhất đang có phiên vẫn thu hồi được
    expect(plan(accounts, [mem('s1', false), mem('s2')], [])).toMatchObject({
      revoke: ['a1'],
      adminOff: ['a1'],
    });
  });

  it('TC-328: số cần thu hồi vượt trần → capped, không thu hồi, admin vẫn đồng bộ; đúng bằng trần thì thu hồi', () => {
    const accounts = [acc('a1', 's1'), acc('a2', 's2'), acc('a3', 's3', { admin: true })];
    const over = plan(accounts, [mem('s3')], [], 1);
    expect(over).toMatchObject({ revoke: [], capped: true, adminOff: ['a3'] });
    const equal = plan(accounts, [mem('s2'), mem('s3')], [], 1);
    expect(equal).toMatchObject({ revoke: ['a1'], capped: false });
  });
});
