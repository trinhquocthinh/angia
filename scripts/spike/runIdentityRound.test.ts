import { expect, it, vi } from 'vitest';
import { runIdentityRound } from './runIdentityRound.js';

function setup() {
  let password = '';
  let locked = false;
  return {
    createUser: vi.fn(async (_username: string, value: string) => {
      password = value;
      return { pk: 42, uid: 'uid-42' };
    }),
    verifyPassword: vi.fn(async (_username: string, value: string) => {
      if (locked) throw new Error('ERR_ACCOUNT_LOCKED');
      if (value !== password) throw new Error('idp_invalid_credentials');
      return 'uid-42';
    }),
    setPassword: vi.fn(async (_id: number, value: string) => {
      password = value;
    }),
    lock: vi.fn(async () => {
      locked = true;
    }),
    unlock: vi.fn(async () => {
      locked = false;
    }),
    deleteUser: vi.fn(async () => {}),
  };
}

it('TC-873 hoàn tất vòng đời, đo từng bước và không ghi mật khẩu', async () => {
  const provider = setup();
  const row = await runIdentityRound(provider, 1, 'spike-test');
  expect(row).toMatchObject({ success: true, deleted: true, error: null, cleanupError: null });
  expect(Object.keys(row.timings)).toEqual([
    'createUser',
    'login',
    'setPassword',
    'loginAfterChange',
    'oldPasswordDenied',
    'lock',
    'lockedLoginDenied',
    'unlock',
    'loginAfterUnlock',
    'deleteUser',
  ]);
  const originalPassword = provider.createUser.mock.calls[0]?.[1];
  expect(JSON.stringify(row)).not.toContain(originalPassword);
  expect(provider.deleteUser).toHaveBeenCalledWith(42);
});

it('TC-874 không cho qua nếu đăng nhập vẫn được sau khi khoá', async () => {
  const provider = setup();
  provider.lock.mockImplementation(async () => {});
  const row = await runIdentityRound(provider, 1, 'spike-test');
  expect(row).toMatchObject({
    success: false,
    failedStep: 'lockedLoginDenied',
    error: 'idp_expected_rejection',
    deleted: true,
  });
});

it('TC-873 giữ cả lỗi thao tác và lỗi dọn user', async () => {
  const provider = setup();
  provider.setPassword.mockRejectedValue(new Error('idp_http_403'));
  provider.deleteUser.mockRejectedValue(new Error('idp_timeout'));
  expect(await runIdentityRound(provider, 1, 'spike-test')).toMatchObject({
    success: false,
    failedStep: 'setPassword',
    error: 'idp_http_403',
    cleanupError: 'idp_timeout',
    deleted: false,
  });
});

it('TC-873 vẫn dọn user nếu danh tính đăng nhập không khớp', async () => {
  const provider = setup();
  provider.verifyPassword.mockResolvedValue('another-uid');
  expect(await runIdentityRound(provider, 1, 'spike-test')).toMatchObject({
    success: false,
    error: 'idp_identity_mismatch',
    deleted: true,
  });
});

it('TC-873 hết ngân sách giữa vòng vẫn xoá user và không bắt đầu đổi mật khẩu', async () => {
  const provider = setup();
  let exhausted = false;
  const create = provider.createUser.getMockImplementation()!;
  provider.createUser.mockImplementation(async (username, password) => {
    const user = await create(username, password);
    exhausted = true;
    return user;
  });
  expect(
    await runIdentityRound(provider, 1, 'spike-test', () => (exhausted ? 'idp_budget_exhausted' : null)),
  ).toMatchObject({ success: false, error: 'idp_budget_exhausted', deleted: true });
  expect(provider.verifyPassword).not.toHaveBeenCalled();
  expect(provider.setPassword).not.toHaveBeenCalled();
});
