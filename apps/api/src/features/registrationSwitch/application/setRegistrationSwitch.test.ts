import { describe, expect, it, vi } from 'vitest';
import { setRegistrationSwitch } from './setRegistrationSwitch.js';

describe('Công tắc mở đăng ký', () => {
  it.each([
    { isSystemAdmin: false, authMethod: 'oidc' as const },
    { isSystemAdmin: true, authMethod: 'local' as const },
  ])('TC-834: từ chối người không phải admin OIDC trước khi gọi repository: %j', async (rights) => {
    const repository = { setOpen: vi.fn() };
    expect(await setRegistrationSwitch(repository, { accountId: 'actor', ...rights }, false)).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
    expect(repository.setOpen).not.toHaveBeenCalled();
  });
  it.each([false, true])('TC-833: admin OIDC lưu trạng thái %s', async (open) => {
    const repository = { setOpen: vi.fn().mockResolvedValue(undefined) };
    expect(
      await setRegistrationSwitch(
        repository,
        {
          accountId: 'admin',
          isSystemAdmin: true,
          authMethod: 'oidc',
        },
        open,
      ),
    ).toEqual({ ok: true, value: { registrationOpen: open } });
    expect(repository.setOpen).toHaveBeenCalledExactlyOnceWith('admin', open);
  });
});
