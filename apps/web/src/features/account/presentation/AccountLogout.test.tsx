import * as React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { logoutSession } from '@src/features/auth/infrastructure/logoutSession';
import { AccountLogout } from './AccountLogout';

vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useState: (value: unknown) => [value, vi.fn()],
}));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@src/features/auth/infrastructure/logoutSession', () => ({ logoutSession: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

it('TC-748: đăng xuất thành công xoá tên người đặt lại cùng CSRF phiên hạn chế', async () => {
  const removeItem = vi.fn();
  vi.stubGlobal('sessionStorage', { removeItem });
  vi.mocked(logoutSession).mockResolvedValue();
  const element = AccountLogout({ token: 'csrf' });
  const button = React.Children.toArray(element.props.children).find(
    (child) => React.isValidElement(child) && child.type === 'button',
  ) as React.ReactElement<{ onClick: () => void }>;
  button.props.onClick();
  await vi.waitFor(() => expect(removeItem).toHaveBeenCalledWith('angia.restrictedCsrf'));
  expect(removeItem).toHaveBeenCalledWith('angia.passwordResetBy');
});
