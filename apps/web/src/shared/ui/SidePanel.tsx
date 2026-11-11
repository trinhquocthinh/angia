import type { ReactNode } from 'react';
import { Sheet } from './sheet/Sheet';
import { Button } from './button/Button';

type Props = {
  titleId: string;
  title: string;
  subtitle: string;
  closeLabel: string;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
};

// Side panel thuốc theo Stitch f29c92d0: phải màn hình ở desktop, đáy màn hình ở mobile; đầu cố định,
// thân cuộn riêng. Trả focus về nút mở khi đóng; chặn Escape/đóng khi đang lưu.
export function SidePanel({ titleId, title, subtitle, closeLabel, pending, onClose, children }: Props) {
  return (
    <Sheet labelledBy={titleId} pending={pending} onCancel={onClose} placement="side">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-6 py-5">
        <div className="min-w-0 break-words">
          <h2 id={titleId} className="text-[1.375rem] leading-[1.875rem] font-semibold text-text-primary">
            {title}
          </h2>
          <p className="mt-0.5 text-base leading-6 text-text-secondary">{subtitle}</p>
        </div>
        <Button variant="icon" type="button" disabled={pending} onClick={onClose} aria-label={closeLabel}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </Sheet>
  );
}
