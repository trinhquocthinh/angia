import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { useMemberResetDialog } from './useMemberResetDialog';

const passwordResetMock = vi.hoisted(() => ({
  pending: false,
  error: null as string | null,
  result: { temporaryPassword: 'Temp1234!', expiresAt: '2026-11-24T04:30:00.000Z' } as {
    temporaryPassword: string;
    expiresAt: string;
  } | null,
  clearError: vi.fn(),
  clearResult: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('../../application/useMemberPasswordReset', () => ({
  useMemberPasswordReset: () => passwordResetMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

it('TC-756: đóng hoặc mở lại hộp đặt lại mật khẩu đều xoá mật khẩu tạm khỏi state', () => {
  let hook!: ReturnType<typeof useMemberResetDialog>;
  function Probe() {
    hook = useMemberResetDialog({
      member: { accountId: 'hoa', displayName: 'Mẹ Hoa', role: 'member', isOwner: false, isSelf: false },
      csrfToken: 'csrf',
      onReload: async () => undefined,
    });
    return null;
  }
  renderToStaticMarkup(<Probe />);

  hook.closeResetDialog();
  hook.openResetDialog();
  expect(passwordResetMock.clearResult).toHaveBeenCalledTimes(2);
});
