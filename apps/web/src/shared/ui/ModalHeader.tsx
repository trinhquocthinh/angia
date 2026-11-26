import type { ReactNode } from 'react';
import { Button } from './button/Button';

type Props = {
  titleId: string;
  icon: ReactNode;
  tone: 'warning' | 'accent';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  closeLabel: string;
  pending: boolean;
  onClose: () => void;
};

const TONES = {
  warning: { tile: 'bg-warning-soft text-warning', chip: 'bg-warning-soft text-warning' },
  accent: { tile: 'bg-accent-soft text-accent', chip: 'bg-accent-soft text-accent' },
};

// Đầu hộp thoại dùng thang chữ chuẩn/lớn đã duyệt; vùng chạm giữ nguyên.
export function ModalHeader({
  titleId,
  icon,
  tone,
  eyebrow,
  title,
  subtitle,
  closeLabel,
  pending,
  onClose,
}: Props) {
  return (
    <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 px-6 pt-6 pb-4 max-md:px-5 max-md:pt-3">
      <span
        aria-hidden="true"
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_6px_16px_color-mix(in_srgb,var(--color-shadow)_9%,transparent)] ${TONES[tone].tile}`}
      >
        {icon}
      </span>
      <div className="col-span-2 row-start-2 min-w-0 break-words">
        {eyebrow && (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-caption font-medium ${TONES[tone].chip}`}
          >
            {eyebrow}
          </span>
        )}
        <h2 id={titleId} className="font-sans text-heading-2 font-semibold text-accent">
          {title}
        </h2>
        {subtitle && <p className="text-caption text-text-secondary">{subtitle}</p>}
      </div>
      <Button
        className="col-start-2 row-start-1"
        variant="icon"
        type="button"
        disabled={pending}
        onClick={onClose}
        aria-label={closeLabel}
      >
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
  );
}
