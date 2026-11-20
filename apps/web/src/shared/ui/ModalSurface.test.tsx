import { expect, it, vi } from 'vitest';
import { ModalSurface } from './ModalSurface';

vi.mock('./useModalDialog', () => ({ useModalDialog: () => ({ current: null }) }));

it('Escape ở xác nhận lồng nhau không đóng popup ngoài', () => {
  const onClose = vi.fn();
  const dialog = ModalSurface({ className: 'test', onClose, children: null });
  const preventDefault = vi.fn();
  dialog.props.onCancel({ target: {}, currentTarget: {}, preventDefault });
  expect(onClose).not.toHaveBeenCalled();
  expect(preventDefault).not.toHaveBeenCalled();
});

it.each([false, true])('Escape và backdrop chỉ đóng khi không đang gửi: pending=%s', (pending) => {
  const onClose = vi.fn();
  const dialog = ModalSurface({ className: 'test', pending, onClose, children: null });
  const surface = {};
  const preventDefault = vi.fn();
  dialog.props.onCancel({ target: surface, currentTarget: surface, preventDefault });
  expect(preventDefault).toHaveBeenCalledOnce();
  dialog.props.onClick({ target: {}, currentTarget: surface });
  dialog.props.onClick({ target: surface, currentTarget: surface });
  expect(onClose).toHaveBeenCalledTimes(pending ? 0 : 2);
});
