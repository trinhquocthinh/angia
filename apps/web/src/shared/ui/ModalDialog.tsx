import type { ReactNode } from 'react';
import { Sheet } from './sheet/Sheet';

type Props = {
  labelledBy: string;
  role?: 'dialog' | 'alertdialog';
  /** Escape gọi hàm này; khi đang lưu thì không đóng. */
  onCancel: () => void;
  pending: boolean;
  width: 'md' | 'lg' | 'xl';
  children: ReactNode;
};

/** Giữ hợp đồng hiện tại cho các màn đang dùng hộp thoại. */
export function ModalDialog(props: Props) {
  return <Sheet {...props} />;
}
