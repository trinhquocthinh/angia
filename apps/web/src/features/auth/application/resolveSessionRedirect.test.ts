import { describe, expect, it } from 'vitest';
import type { components } from '@src/shared/api/schema.gen';
import { resolveSessionRedirect } from './resolveSessionRedirect';

type Session = components['schemas']['MeContextResponse'];
const waiting: Session = {
  account: { id: 'account', displayName: 'Thịnh', isSystemAdmin: false, healthProfileId: null },
  family: null,
  role: null,
  csrfToken: 'csrf',
};
const assigned: Session = { ...waiting, family: { id: 'family', name: 'Nhà An' }, role: 'main' };

describe('Điều hướng theo phiên hiện hành', () => {
  it.each(['/', '/waiting', '/profiles/new'])('chưa có phiên tại %s: về đăng nhập', (path) => {
    expect(resolveSessionRedirect(null, path)).toBe('/login');
  });
  it('chưa có phiên ở /login: giữ màn đăng nhập, không lặp điều hướng', () => {
    expect(resolveSessionRedirect(null, '/login')).toBeNull();
  });
  it.each(['/', '/login', '/profiles/new'])('chưa có nhóm tại %s: về màn chờ', (path) => {
    expect(resolveSessionRedirect(waiting, path)).toBe('/waiting');
  });
  it('đã ở /waiting: giữ màn chờ', () => {
    expect(resolveSessionRedirect(waiting, '/waiting')).toBeNull();
  });
  it.each(['/login', '/waiting'])('đã có nhóm tại %s: về trang chủ', (path) => {
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
  it.each(['/login', '/waiting'])('admin tại %s: vào quản trị', (path) => {
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
