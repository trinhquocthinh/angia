import { expect, it, vi } from 'vitest';
import { runIdentityProviderSpike } from './runIdentityProviderSpike.js';

function setup() {
  return {
    createUser: vi.fn().mockResolvedValue({ pk: 42, uid: 'uid-42' }),
    verifyPassword: vi
      .fn()
      .mockResolvedValueOnce('uid-42')
      .mockRejectedValueOnce(new Error('idp_invalid_credentials')),
    deleteUser: vi.fn().mockResolvedValue(undefined),
  };
}

it('TC-873 thử đúng/sai mật khẩu và luôn dọn user tổng hợp', async () => {
  const provider = setup();
  const result = await runIdentityProviderSpike(provider, 'spike-test');
  expect(result).toMatchObject({ passwordVerified: true, wrongPasswordRejected: true, deleted: true });
  expect(result.verifyPasswordMs).toBeGreaterThanOrEqual(0);
  const password = provider.createUser.mock.calls[0]?.[1];
  expect(provider.verifyPassword.mock.calls).toEqual([
    ['spike-test', password],
    ['spike-test', `${password}-wrong`],
  ]);
  expect(provider.deleteUser).toHaveBeenCalledWith(42);
});

it('TC-873 lỗi xác thực vẫn dọn user', async () => {
  const provider = setup();
  provider.verifyPassword.mockReset().mockRejectedValue(new Error('idp_unsupported_stage'));
  await expect(runIdentityProviderSpike(provider, 'spike-test')).rejects.toThrow('idp_unsupported_stage');
  expect(provider.deleteUser).toHaveBeenCalledWith(42);
});

it('TC-873 không báo đạt nếu Authentik chấp nhận cả mật khẩu sai', async () => {
  const provider = setup();
  provider.verifyPassword.mockReset().mockResolvedValue('uid-42');
  await expect(runIdentityProviderSpike(provider, 'spike-test')).rejects.toThrow(
    'idp_wrong_password_accepted',
  );
  expect(provider.deleteUser).toHaveBeenCalledWith(42);
});

it('TC-873 báo riêng lỗi dọn user để người vận hành xử lý', async () => {
  const provider = setup();
  provider.deleteUser.mockRejectedValue(new Error('secret-response'));
  await expect(runIdentityProviderSpike(provider, 'spike-test')).rejects.toThrow('idp_cleanup_failed');
});
