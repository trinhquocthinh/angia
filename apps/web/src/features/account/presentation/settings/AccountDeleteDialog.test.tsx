import type * as React from 'react';
import { expect, it, vi } from 'vitest';
import { AccountDeleteDialog } from '@src/features/account/presentation/settings/AccountDeleteDialog';
import { ModalSurface } from '@src/shared/ui/ModalSurface';

vi.mock('react', async (original) => ({
  ...(await original<typeof React>()),
  useId: () => 'delete-title',
}));
vi.mock('@src/shared/ui/useModalDialog', () => ({ useModalDialog: () => ({ current: null }) }));

it.each([false, true])('TC-827: Esc và nền chỉ đóng hộp xoá khi không pending=%s', (pending) => {
  const onClose = vi.fn();
  const element = AccountDeleteDialog({
    hasLinkedProfile: true,
    password: 'secret',
    disposition: null,
    pending,
    canSubmit: false,
    error: null,
    errorCode: null,
    onClose,
    onPasswordChange: vi.fn(),
    onDispositionChange: vi.fn(),
    onSubmit: vi.fn(),
  });
  const dialog = ModalSurface(element.props);
  const surface = {};
  const preventDefault = vi.fn();
  dialog.props.onCancel({ target: surface, currentTarget: surface, preventDefault });
  expect(preventDefault).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledTimes(pending ? 0 : 1);
  dialog.props.onClick({ target: surface, currentTarget: surface });
  expect(onClose).toHaveBeenCalledTimes(pending ? 0 : 2);
});
