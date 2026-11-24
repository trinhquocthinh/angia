import type { ReactNode } from 'react';

type Props = {
  message: string | null;
  className?: string;
  icon?: ReactNode;
};

export function FormAlert({ message, className, icon }: Props) {
  if (!message) return null;
  return (
    <p role="alert" className={className ?? 'flex items-start gap-2 text-base leading-6 text-danger'}>
      {icon ?? (
        <svg
          aria-hidden="true"
          className="mt-0.5 shrink-0"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6m0 3v1" />
        </svg>
      )}
      <span>{message}</span>
    </p>
  );
}
