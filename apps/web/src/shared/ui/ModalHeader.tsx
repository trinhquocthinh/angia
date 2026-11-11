import type { ReactNode } from 'react';

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

// Đầu hộp thoại: ô biểu tượng (bật nhẹ khi mở), nhãn nhỏ, tiêu đề serif Newsreader và nút đóng.
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
    <div className="flex shrink-0 items-start gap-4 px-6 pt-6 pb-4 max-md:px-5 max-md:pt-3">
      <span
        aria-hidden="true"
        className={`angia-modal-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-[0_6px_16px_color-mix(in_srgb,var(--color-shadow)_9%,transparent)] ${TONES[tone].tile}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase ${TONES[tone].chip}`}
          >
            {eyebrow}
          </span>
        )}
        <h2
          id={titleId}
          className="font-['Newsreader',Georgia,serif] text-[22px] leading-7 font-semibold text-accent"
        >
          {title}
        </h2>
        {subtitle && <p className="text-sm leading-5 text-text-secondary">{subtitle}</p>}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={onClose}
        aria-label={closeLabel}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-text-secondary transition-colors duration-200 hover:bg-border hover:text-text-primary disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
      </button>
    </div>
  );
}
