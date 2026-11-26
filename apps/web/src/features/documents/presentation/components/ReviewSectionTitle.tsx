import type { ReactNode } from 'react';

type ReviewSectionTitleProps = { id?: string; title: string; aside?: ReactNode; count?: string };

// Tiêu đề khối trong form duyệt theo Stitch bb3e9ab1: chấm nhấn + tiêu đề serif + chip số lượng mềm.
export function ReviewSectionTitle({ id, title, aside, count }: ReviewSectionTitleProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id={id} className="auth-heading flex items-center gap-2.5 text-heading-2 font-semibold text-accent">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        <span>{title}</span>
      </h2>
      {count && (
        <span className="shrink-0 rounded-full bg-secondary-container px-3 py-0.5 text-caption font-bold text-on-secondary-container tabular-nums">
          {count}
        </span>
      )}
      {aside}
    </div>
  );
}
