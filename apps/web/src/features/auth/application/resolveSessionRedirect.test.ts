import { describe, expect, it } from 'vitest';
import type { components } from '@src/shared/api/schema.gen';
import { resolveSessionRedirect } from './resolveSessionRedirect';

type Session = components['schemas']['MeContextResponse'];
const waiting: Session = {
  account: { id: 'account', displayName: 'Thịnh', isSystemAdmin: false, healthProfileId: null },
  family: null,
  role: null,
  csrfToken: 'csrf',
  authMethod: 'local',
  hasLocalCredential: true,
  emailStatus: { email: null, emailVerified: false, pendingEmail: null },
  features: { redactionSuggestions: false, localEnrollmentEnabled: false },
};
const assigned: Session = { ...waiting, family: { id: 'family', name: 'Nhà An' }, role: 'main' };

describe('Điều hướng theo phiên hiện hành', () => {
  it.each(['/', '/waiting', '/profiles/new'])('chưa có phiên tại %s: về đăng nhập', (path) => {
    expect(resolveSessionRedirect(null, path)).toBe('/login');
  });
  it('chưa có phiên ở /login: giữ màn đăng nhập, không lặp điều hướng', () => {
    expect(resolveSessionRedirect(null, '/login')).toBeNull();
  });
  it.each(['/', '/login', '/register', '/profiles/new'])('chưa có nhóm tại %s: về màn chờ', (path) => {
    expect(resolveSessionRedirect(waiting, path)).toBe('/waiting');
  });
  it('đã ở /waiting: giữ màn chờ', () => {
    expect(resolveSessionRedirect(waiting, '/waiting')).toBeNull();
  });
  it.each(['/login', '/register', '/waiting'])('đã có nhóm tại %s: về trang chủ', (path) => {
    expect(resolveSessionRedirect(assigned, path)).toBe('/');
  });
  it('đã có nhóm: giữ tuyến nội bộ đang truy cập', () => {
    expect(resolveSessionRedirect(assigned, '/')).toBeNull();
    expect(resolveSessionRedirect(assigned, '/profiles/new')).toBeNull();
  });
  it('admin chưa có nhóm: trang chủ điều hướng tới quản trị', () => {
    const admin = { ...waiting, account: { ...waiting.account, isSystemAdmin: true } };
    expect(resolveSessionRedirect(admin, '/')).toBe('/admin');
  });
});

const admin = { ...waiting, account: { ...waiting.account, isSystemAdmin: true } };
describe('Điều hướng quản trị hệ thống', () => {
  it('admin chưa có nhóm được vào /admin', () => {
    expect(resolveSessionRedirect(admin, '/admin')).toBeNull();
  });
  it.each(['/login', '/register', '/waiting'])('admin tại %s: vào quản trị', (path) => {
    expect(resolveSessionRedirect(admin, path)).toBe('/admin');
  });
  it('người thường có nhóm không được vào /admin', () => {
    expect(resolveSessionRedirect(assigned, '/admin')).toBe('/');
  });
  it('người thường chưa có nhóm vẫn về màn chờ', () => {
    expect(resolveSessionRedirect(waiting, '/admin')).toBe('/waiting');
  });
  it('khách truy cập /admin phải đăng nhập', () => {
    expect(resolveSessionRedirect(null, '/admin')).toBe('/login');
  });
});

it('chưa có phiên tại /register được ở lại màn tạo tài khoản', () => {
  expect(resolveSessionRedirect(null, '/register')).toBeNull();
});

it('TC-748: màn đổi mật khẩu hiển thị được khi /api/me bị hạn chế', () => {
  expect(resolveSessionRedirect(null, '/account/change-password')).toBeNull();
});
it.each(['/account/legal-update', '/account/local-password'])(
  'TC-755: màn %s cần có phiên nhưng không cần nhà',
  (path) => {
    expect(resolveSessionRedirect(null, path)).toBe('/login');
    expect(resolveSessionRedirect(waiting, path)).toBeNull();
  },
);

it('TC-762: khách truy cập được màn quên mật khẩu công khai', () => {
  expect(resolveSessionRedirect(null, '/forgot-password')).toBeNull();
});

it('TC-764: khách và tài khoản đang đăng nhập truy cập được màn đặt lại mật khẩu công khai', () => {
  expect(resolveSessionRedirect(null, '/reset-password')).toBeNull();
  expect(resolveSessionRedirect(assigned, '/reset-password')).toBeNull();
});
