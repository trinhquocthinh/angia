import { expect, it } from 'vitest';
import { resolveEnrollmentRedirect } from './resolveEnrollmentRedirect';
const eligible = {
  account: { isSystemAdmin: false },
  authMethod: 'oidc' as const,
  hasLocalCredential: false,
  features: { localEnrollmentEnabled: true },
};
it('TC-900: admin OIDC chưa có mật khẩu không được mời enrollment tại trang chủ', () => {
  const admin = { ...eligible, account: { isSystemAdmin: true } };
  expect(resolveEnrollmentRedirect(admin, '/', false, false)).toBeNull();
  expect(resolveEnrollmentRedirect(admin, '/', true, true)).toBeNull();
});
it('TC-751: mời một lần mỗi tab tại trang chủ', () => {
  expect(resolveEnrollmentRedirect(eligible, '/', false, false)).toBe('/account/local-password');
  expect(resolveEnrollmentRedirect(eligible, '/', true, false)).toBeNull();
  expect(resolveEnrollmentRedirect(eligible, '/profiles/new', false, false)).toBeNull();
});
it('TC-900: quay về từ xác minh ưu tiên hơn Để sau', () => {
  expect(resolveEnrollmentRedirect(eligible, '/', true, true)).toBe('/account/local-password');
});
it('TC-902: chỉ mời OIDC chưa có mật khẩu và cờ bật', () => {
  expect(resolveEnrollmentRedirect({ ...eligible, authMethod: 'local' }, '/', false, false)).toBeNull();
  expect(resolveEnrollmentRedirect({ ...eligible, hasLocalCredential: true }, '/', false, false)).toBeNull();
  expect(
    resolveEnrollmentRedirect({ ...eligible, features: { localEnrollmentEnabled: false } }, '/', false, true),
  ).toBeNull();
  expect(resolveEnrollmentRedirect(null, '/', false, true)).toBeNull();
});
